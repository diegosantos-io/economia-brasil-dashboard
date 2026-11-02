
import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  AfterViewInit
} from '@angular/core';

import * as echarts from 'echarts';

import { IpcaResponse } from '../../models/ipca-response';
import { SelicResponse } from '../../models/selic-response';
import { PibResponse } from '../../models/pib-response';
import { CambioResponse } from '../../models/cambio-response';

type Indicador = 'ipca' | 'selic' | 'pib' | 'cambio';

@Component({
  selector: 'app-economic-chart',
  standalone: true,
  template: `
    <div class="chart-container">
      <div #chartContainer class="chart-canvas"></div>

      @if (semDados) {
        <div class="empty-chart-message">
          <strong>Nenhum dado encontrado</strong>
          <span>
            Não existem registros disponíveis para o indicador e intervalo selecionados.
          </span>
        </div>
      }
    </div>
  `,
  styleUrl: './economic-chart.scss'
})
export class EconomicChart implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('chartContainer')
  chartContainer!: ElementRef<HTMLDivElement>;

  @Input() indicador: Indicador = 'ipca';
  @Input() periodoDias = 365;

  @Input() dataInicial = '';
  @Input() dataFinal = '';

  @Input() ipcaDados: IpcaResponse[] = [];
  @Input() selicDados: SelicResponse[] = [];
  @Input() pibDados: PibResponse[] = [];
  @Input() cambioDados: CambioResponse[] = [];

  private chart?: echarts.ECharts;
  private resizeObserver?: ResizeObserver;

  semDados = false;

  private readonly cores: Record<Indicador, string> = {
    ipca: '#c084fc',
    selic: '#38bdf8',
    pib: '#34d399',
    cambio: '#fbbf24'
  };

  // =========================
  // CONVERSÃO DE DATAS
  // =========================

  private converterData(data: string): Date | null {
    if (!data) {
      return null;
    }

    // YYYYMM
    if (/^\d{6}$/.test(data)) {
      const ano = Number(data.substring(0, 4));
      const mes = Number(data.substring(4, 6));

      if (mes < 1 || mes > 12) {
        return null;
      }

      return new Date(ano, mes - 1, 1);
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const [ano, mes, dia] = data.split('-').map(Number);

      const resultado = new Date(ano, mes - 1, dia);

      if (
        resultado.getFullYear() !== ano ||
        resultado.getMonth() !== mes - 1 ||
        resultado.getDate() !== dia
      ) {
        return null;
      }

      return resultado;
    }

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      const [dia, mes, ano] = data.split('/').map(Number);

      const resultado = new Date(ano, mes - 1, dia);

      if (
        resultado.getFullYear() !== ano ||
        resultado.getMonth() !== mes - 1 ||
        resultado.getDate() !== dia
      ) {
        return null;
      }

      return resultado;
    }

    return null;
  }

  private converterDataParaOrdenacao(data: string): number {
    const dataConvertida = this.converterData(data);

    return dataConvertida
      ? dataConvertida.getTime()
      : 0;
  }

  // =========================
  // FILTRO DE DATAS
  // =========================

  private dentroDoIntervalo(data: string): boolean {
    if (!this.dataInicial || !this.dataFinal) {
      return true;
    }

    const registro = this.converterData(data);
    const inicio = this.converterData(this.dataInicial);
    const fim = this.converterData(this.dataFinal);

    if (!registro || !inicio || !fim) {
      return false;
    }

    return registro >= inicio && registro <= fim;
  }

  // =========================
  // FILTRO DO PIB
  // =========================

  
  private trimestreDentroDoIntervalo(periodo: string): boolean {
    if (!/^\d{6}$/.test(periodo)) {
        return false;
    }

    const ano = Number(periodo.substring(0, 4));
    const trimestre = Number(periodo.substring(4, 6));

    if (trimestre < 1 || trimestre > 4) {
        return false;
    }

    let inicio: Date;
    let fim: Date;

    if (this.dataInicial && this.dataFinal) {
        const dataInicio = this.converterData(this.dataInicial);
        const dataFim = this.converterData(this.dataFinal);

        if (!dataInicio || !dataFim) {
        return false;
        }

        inicio = dataInicio;
        fim = dataFim;
    } else {
        fim = new Date();
        inicio = new Date(fim);

        inicio.setDate(inicio.getDate() - this.periodoDias);
    }

    const mesInicial = (trimestre - 1) * 3;

    const inicioTrimestre = new Date(
        ano,
        mesInicial,
        1
    );

    const fimTrimestre = new Date(
        ano,
        mesInicial + 3,
        0
    );

    return inicioTrimestre <= fim && fimTrimestre >= inicio;
  }


  // =========================
  // INICIALIZAÇÃO
  // =========================

  ngAfterViewInit(): void {
    const elemento = this.chartContainer.nativeElement;

    this.chart = echarts.init(elemento);

    this.atualizarGrafico();

    this.resizeObserver = new ResizeObserver(() => {
      this.chart?.resize();
    });

    this.resizeObserver.observe(elemento);
  }

  // =========================
  // ALTERAÇÕES NOS INPUTS
  // =========================

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart) {
      this.atualizarGrafico();
    }
  }

  // =========================
  // FORMATAÇÃO
  // =========================

  private formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(valor);
  }

  // =========================
  // ATUALIZAÇÃO DO GRÁFICO
  // =========================

  private atualizarGrafico(): void {
    if (!this.chart) {
      return;
    }

    let categorias: string[] = [];
    let valores: number[] = [];

    let nomeIndicador = '';
    let unidade = '';

    switch (this.indicador) {

      // IPCA
      case 'ipca': {
        const dados = [...this.ipcaDados]
          .filter(item => this.dentroDoIntervalo(item.periodo))
          .sort((a, b) => a.periodo.localeCompare(b.periodo));

        categorias = dados.map(item => item.periodoFormatado);
        valores = dados.map(item => item.valor);

        nomeIndicador = 'IPCA';
        unidade = '%';

        break;
      }

      // SELIC
      case 'selic': {
        const dados = [...this.selicDados]
          .filter(item => this.dentroDoIntervalo(item.data))
          .sort((a, b) =>
            this.converterDataParaOrdenacao(a.data) -
            this.converterDataParaOrdenacao(b.data)
          );

        categorias = dados.map(item => item.dataFormatada);
        valores = dados.map(item => item.valor);

        nomeIndicador = 'Taxa Selic';
        unidade = '% a.a.';

        break;
      }

      // PIB
      case 'pib': {
        const dados = [...this.pibDados]
          .filter(item => this.trimestreDentroDoIntervalo(item.periodo))
          .sort((a, b) => a.periodo.localeCompare(b.periodo));

        categorias = dados.map(item => item.periodoFormatado);
        valores = dados.map(item => item.crescimento);

        nomeIndicador = 'Crescimento do PIB';
        unidade = '%';

        break;
      }

      // CÂMBIO
      case 'cambio': {
        const dados = [...this.cambioDados]
          .filter(item => this.dentroDoIntervalo(item.data))
          .sort((a, b) =>
            this.converterDataParaOrdenacao(a.data) -
            this.converterDataParaOrdenacao(b.data)
          );

        categorias = dados.map(item => item.data);
        valores = dados.map(item => item.venda);

        nomeIndicador = 'Dólar comercial';
        unidade = 'R$';

        break;
      }
    }

    this.semDados = valores.length === 0;

    console.log('Indicador selecionado:', this.indicador);
    console.log('Série:', nomeIndicador);
    console.log('Quantidade de pontos:', valores.length);

    const cor = this.cores[this.indicador];

    this.chart.clear();

    this.chart.setOption({

      backgroundColor: 'transparent',

      animation: true,
      animationDuration: 700,

      tooltip: {
        trigger: 'axis',

        backgroundColor: '#172238',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,

        textStyle: {
          color: '#ffffff',
          fontSize: 12
        },

        formatter: (params: any) => {
          const ponto = params[0];

          if (!ponto) {
            return '';
          }

          return `
            <div style="font-weight:600;margin-bottom:8px;">
              ${ponto.axisValue}
            </div>

            <div style="display:flex;align-items:center;gap:8px;">

              <span style="
                width:8px;
                height:8px;
                border-radius:50%;
                background:${cor};
                display:inline-block;
              "></span>

              <span>${nomeIndicador}</span>

              <strong style="margin-left:auto;">
                ${this.formatarValor(Number(ponto.value))} ${unidade}
              </strong>

            </div>
          `;
        }
      },

      grid: {
        left: '5%',
        right: '4%',
        top: '12%',
        bottom: this.indicador === 'pib' ? '15%' : '12%',
        containLabel: true
      },

      xAxis: {
        type: 'category',
        data: categorias,

        axisLabel: {
          color: '#94a3b8',

          rotate: this.indicador === 'pib' ? 0 : 35,

          interval: this.indicador === 'pib'
            ? Math.max(0, Math.ceil(categorias.length / 8) - 1)
            : 'auto',

          fontSize: 11,
          hideOverlap: true
        },

        axisLine: {
          lineStyle: {
            color: '#334155'
          }
        },

        axisTick: {
          show: false
        }
      },

      yAxis: {
        type: 'value',

        axisLabel: {
          color: '#94a3b8',

          formatter: (valor: number) => {
            return this.indicador === 'cambio'
              ? this.formatarValor(valor)
              : `${valor}%`;
          }
        },

        splitLine: {
          lineStyle: {
            color: '#263449',
            type: 'solid'
          }
        }
      },

      series: [{
        name: nomeIndicador,
        type: 'line',
        smooth: true,
        data: valores,

        symbol: 'circle',
        symbolSize: 7,

        lineStyle: {
          width: 3,
          color: cor
        },

        itemStyle: {
          color: cor
        },

        emphasis: {
          focus: 'series',

          itemStyle: {
            borderWidth: 3,
            borderColor: '#ffffff'
          }
        },

        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,

            colorStops: [
              {
                offset: 0,
                color: this.corComOpacidade(cor, 0.30)
              },
              {
                offset: 1,
                color: this.corComOpacidade(cor, 0.01)
              }
            ]
          }
        }
      }]

    });
  }

  // =========================
  // CORES
  // =========================

  private corComOpacidade(
    cor: string,
    opacidade: number
  ): string {
    const hexadecimal = cor.replace('#', '');

    const r = parseInt(hexadecimal.substring(0, 2), 16);
    const g = parseInt(hexadecimal.substring(2, 4), 16);
    const b = parseInt(hexadecimal.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacidade})`;
  }

  // =========================
  // DESTRUIÇÃO
  // =========================

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
  }
}
