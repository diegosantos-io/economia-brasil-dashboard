
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { EconomicChart } from '../components/economic-chart/economic-chart';
import { IndicadorService } from '../services/indicador.service';

import { CambioResponse } from '../models/cambio-response';
import { IpcaResponse } from '../models/ipca-response';
import { SelicResponse } from '../models/selic-response';
import { PibResponse } from '../models/pib-response';

type Indicador = 'ipca' | 'selic' | 'pib' | 'cambio';

interface LinhaExportacao {
  periodo: string;
  valor: string | number;
  unidade: string;
  fonte: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    EconomicChart
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  indicadorSelecionado: Indicador = 'ipca';
  periodoSelecionado = 365;

  filtroPersonalizadoAtivo = false;

  dataInicial = '';
  dataFinal = '';

  dataInicialFiltro = '';
  dataFinalFiltro = '';

  erroIntervaloDatas = false;

  ipcaDados: IpcaResponse[] = [];
  ipcaAtual: IpcaResponse | null = null;
  carregandoIpca = true;
  erroIpca = false;

  selicDados: SelicResponse[] = [];
  selicAtual: SelicResponse | null = null;
  carregandoSelic = true;
  erroSelic = false;

  pibDados: PibResponse[] = [];
  pibAtual: PibResponse | null = null;
  carregandoPib = true;
  erroPib = false;

  cambioDados: CambioResponse[] = [];
  cambioAtual: CambioResponse | null = null;
  carregandoCambio = true;
  erroCambio = false;

  constructor(
    private indicadorService: IndicadorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarDadosPeriodo();
    this.carregarPib();
  }

  // =========================
  // INDICADOR
  // =========================

  alterarIndicador(indicador: Indicador): void {
    this.indicadorSelecionado = indicador;
  }

  get nomeIndicadorSelecionado(): string {
    const nomes: Record<Indicador, string> = {
      ipca: 'IPCA',
      selic: 'Taxa Selic',
      pib: 'PIB',
      cambio: 'Dólar'
    };

    return nomes[this.indicadorSelecionado];
  }

  // =========================
  // PERÍODO
  // =========================

  alterarPeriodo(periodo: string): void {
    const dias = Number(periodo);

    if (![30, 90, 180, 365].includes(dias)) {
      return;
    }

    this.periodoSelecionado = dias;
    this.filtroPersonalizadoAtivo = false;

    this.dataInicial = '';
    this.dataFinal = '';
    this.dataInicialFiltro = '';
    this.dataFinalFiltro = '';

    this.erroIntervaloDatas = false;

    this.carregarDadosPeriodo();
  }

  get descricaoPeriodoAplicado(): string {
    if (this.filtroPersonalizadoAtivo) {
      return `${this.formatarData(this.dataInicialFiltro)} até ${this.formatarData(this.dataFinalFiltro)}`;
    }

    const periodos: Record<number, string> = {
      30: 'Últimos 30 dias',
      90: 'Últimos 90 dias',
      180: 'Últimos 6 meses',
      365: 'Último ano'
    };

    return periodos[this.periodoSelecionado] ?? 'Último ano';
  }

  // =========================
  // FILTRO PERSONALIZADO
  // =========================

  aplicarIntervaloPersonalizado(): void {
    const inicio = this.dataInicial;
    const fim = this.dataFinal;

    if (!inicio || !fim) {
      this.erroIntervaloDatas = true;
      return;
    }

    const formatoData = /^\d{4}-\d{2}-\d{2}$/;

    if (!formatoData.test(inicio) || !formatoData.test(fim)) {
      this.erroIntervaloDatas = true;
      return;
    }

    const validarData = (data: string): boolean => {
      const [ano, mes, dia] = data.split('-').map(Number);
      const validada = new Date(ano, mes - 1, dia);

      return (
        validada.getFullYear() === ano &&
        validada.getMonth() === mes - 1 &&
        validada.getDate() === dia
      );
    };

    if (!validarData(inicio) || !validarData(fim) || inicio > fim) {
      this.erroIntervaloDatas = true;
      return;
    }

    this.dataInicialFiltro = inicio;
    this.dataFinalFiltro = fim;

    this.filtroPersonalizadoAtivo = true;
    this.erroIntervaloDatas = false;

    this.cdr.detectChanges();
  }

  limparFiltros(): void {
    this.dataInicial = '';
    this.dataFinal = '';

    this.dataInicialFiltro = '';
    this.dataFinalFiltro = '';

    this.erroIntervaloDatas = false;
    this.filtroPersonalizadoAtivo = false;

    this.periodoSelecionado = 365;

    this.carregarDadosPeriodo();
    this.cdr.detectChanges();
  }

  // =========================
  // NORMALIZAÇÃO DE DATAS
  // =========================

  private formatarData(data: string): string {
    if (!data) {
      return '';
    }

    const [ano, mes, dia] = data.split('-');

    return `${dia}/${mes}/${ano}`;
  }

  private normalizarData(data: string): string | null {
    if (!data) {
      return null;
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return data;
    }

    // YYYYMMDD
    if (/^\d{8}$/.test(data)) {
      return `${data.substring(0, 4)}-${data.substring(4, 6)}-${data.substring(6, 8)}`;
    }

    // YYYYMM: referência mensal
    if (/^\d{6}$/.test(data)) {
      return `${data.substring(0, 4)}-${data.substring(4, 6)}-01`;
    }

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      const [dia, mes, ano] = data.split('/');
      return `${ano}-${mes}-${dia}`;
    }

    return null;
  }

  private converterDataParaOrdenacao(data: string): number {
    const normalizada = this.normalizarData(data);

    if (!normalizada) {
      return 0;
    }

    const [ano, mes, dia] = normalizada.split('-').map(Number);
    const dataConvertida = new Date(ano, mes - 1, dia);

    if (
      dataConvertida.getFullYear() !== ano ||
      dataConvertida.getMonth() !== mes - 1 ||
      dataConvertida.getDate() !== dia
    ) {
      return 0;
    }

    return dataConvertida.getTime();
  }

  private dataDentroDoIntervalo(data: string): boolean {
    if (!this.filtroPersonalizadoAtivo) {
      return true;
    }

    const normalizada = this.normalizarData(data);

    if (!normalizada) {
      return false;
    }

    return (
      normalizada >= this.dataInicialFiltro &&
      normalizada <= this.dataFinalFiltro
    );
  }

    
  private trimestreDentroDoIntervalo(periodo: string): boolean {
    if (!/^\d{6}$/.test(periodo)) {
        return false;
    }

    const ano = Number(periodo.substring(0, 4));
    const trimestre = Number(periodo.substring(4, 6));

    if (trimestre < 1 || trimestre > 4) {
        return false;
    }

    let inicioFiltro: string;
    let fimFiltro: string;

    if (this.filtroPersonalizadoAtivo) {
        inicioFiltro = this.dataInicialFiltro;
        fimFiltro = this.dataFinalFiltro;
    } else {
        const hoje = new Date();
        const inicio = new Date(hoje);

        inicio.setDate(inicio.getDate() - this.periodoSelecionado);

        const formatarISO = (data: Date): string => {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');

        return `${ano}-${mes}-${dia}`;
        };

        inicioFiltro = formatarISO(inicio);
        fimFiltro = formatarISO(hoje);
    }

    const mesInicial = (trimestre - 1) * 3 + 1;
    const mesFinal = mesInicial + 2;

    const inicioTrimestre =
        `${ano}-${String(mesInicial).padStart(2, '0')}-01`;

    const ultimoDia = new Date(ano, mesFinal, 0).getDate();

    const fimTrimestre =
        `${ano}-${String(mesFinal).padStart(2, '0')}-${ultimoDia}`;

    return (
        inicioTrimestre <= fimFiltro &&
        fimTrimestre >= inicioFiltro
    );
  }

  // =========================
  // DADOS PARA EXPORTAÇÃO
  // =========================

  private obterDadosExportacao(): LinhaExportacao[] {
    switch (this.indicadorSelecionado) {

      case 'ipca':
        return [...this.ipcaDados]
          .filter(item => this.dataDentroDoIntervalo(item.periodo))
          .sort((a, b) => a.periodo.localeCompare(b.periodo))
          .map(item => ({
            periodo: item.periodoFormatado,
            valor: item.valor,
            unidade: item.unidade,
            fonte: item.fonte
          }));

      case 'selic':
        return [...this.selicDados]
          .filter(item => this.dataDentroDoIntervalo(item.data))
          .sort((a, b) =>
            this.converterDataParaOrdenacao(a.data) -
            this.converterDataParaOrdenacao(b.data)
          )
          .map(item => ({
            periodo: item.dataFormatada,
            valor: item.valor,
            unidade: item.unidade,
            fonte: item.fonte
          }));

      case 'pib':
        return [...this.pibDados]
          .filter(item => this.trimestreDentroDoIntervalo(item.periodo))
          .sort((a, b) => a.periodo.localeCompare(b.periodo))
          .map(item => ({
            periodo: item.periodoFormatado,
            valor: item.crescimento,
            unidade: item.unidadeCrescimento,
            fonte: item.fonte
          }));

      case 'cambio':
        return [...this.cambioDados]
          .filter(item => this.dataDentroDoIntervalo(item.data))
          .sort((a, b) =>
            this.converterDataParaOrdenacao(a.data) -
            this.converterDataParaOrdenacao(b.data)
          )
          .map(item => ({
            periodo: item.data,
            valor: item.venda,
            unidade: `Venda (${item.moeda})`,
            fonte: item.fonte
          }));

      default:
        return [];
    }
  }

  // =========================
  // EXPORTAR CSV
  // =========================

  exportarCSV(): void {
    const dados = this.obterDadosExportacao();

    if (dados.length === 0) {
      alert('Não existem dados disponíveis para exportar neste período.');
      return;
    }

    const cabecalho = [
      'Indicador',
      'Período',
      'Valor',
      'Unidade',
      'Fonte'
    ];

    const linhas = dados.map(item => [
      this.nomeIndicadorSelecionado,
      item.periodo,
      item.valor,
      item.unidade,
      item.fonte
    ]);

    const escaparCSV = (valor: string | number): string => {
      const texto = String(valor ?? '');
      return `"${texto.replace(/"/g, '""')}"`;
    };

    const conteudo = [
      cabecalho,
      ...linhas
    ]
      .map(linha => linha.map(escaparCSV).join(';'))
      .join('\r\n');

    const blob = new Blob(
      ['\uFEFF', conteudo],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `economiabr-${this.indicadorSelecionado}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  // =========================
  // EXPORTAR PDF
  // =========================

  exportarPDF(): void {
    const dados = this.obterDadosExportacao();

    if (dados.length === 0) {
      alert('Não existem dados disponíveis para gerar o relatório.');
      return;
    }

    const documento = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    documento.setFont('helvetica', 'bold');
    documento.setFontSize(18);
    documento.text('EconomiaBR - Relatório Econômico', 14, 18);

    documento.setFont('helvetica', 'normal');
    documento.setFontSize(10);

    documento.text(
      `Indicador: ${this.nomeIndicadorSelecionado}`,
      14,
      29
    );

    documento.text(
      `Período: ${this.descricaoPeriodoAplicado}`,
      14,
      36
    );

    documento.text(
      `Data de geração: ${new Date().toLocaleDateString('pt-BR')}`,
      14,
      43
    );

    const linhas = dados.map(item => [
      item.periodo,
      String(item.valor),
      item.unidade,
      item.fonte
    ]);

    autoTable(documento, {
      startY: 51,
      margin: {
        top: 12,
        right: 14,
        bottom: 18,
        left: 14
      },
      head: [[
        'Período',
        'Valor',
        'Unidade',
        'Fonte'
      ]],
      body: linhas,
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [30, 64, 100],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 244, 248]
      },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 35 },
        2: { cellWidth: 55 },
        3: { cellWidth: 'auto' }
      },
      didDrawPage: () => {
        const pagina = documento.getNumberOfPages();

        documento.setFontSize(8);
        documento.setTextColor(120);

        documento.text(
          'Fonte: IBGE e Banco Central do Brasil, conforme indicador.',
          14,
          documento.internal.pageSize.getHeight() - 9
        );

        documento.text(
          `Página ${pagina}`,
          documento.internal.pageSize.getWidth() - 14,
          documento.internal.pageSize.getHeight() - 9,
          { align: 'right' }
        );
      }
    });

    documento.save(
      `economiabr-relatorio-${this.indicadorSelecionado}.pdf`
    );
  }

  // =========================
  // CARREGAR PIB
  // =========================

  private carregarPib(): void {
    this.carregandoPib = true;
    this.erroPib = false;

    this.indicadorService.buscarPib().subscribe({

      next: (dados) => {
        this.pibDados = dados;

        this.pibAtual = dados.length > 0
          ? dados[0]
          : null;

        this.carregandoPib = false;
        this.erroPib = false;

        this.cdr.detectChanges();
      },

      error: (erro) => {
        console.error('Erro ao buscar PIB:', erro);

        this.erroPib = true;
        this.carregandoPib = false;

        this.cdr.detectChanges();
      }

    });
  }

  // =========================
  // CARREGAMENTO DOS INDICADORES
  // =========================

  carregarDadosPeriodo(): void {
    const mesesPorPeriodo: Record<number, number> = {
      30: 1,
      90: 3,
      180: 6,
      365: 12
    };

    const meses = mesesPorPeriodo[this.periodoSelecionado] ?? 12;

    // IPCA

    this.carregandoIpca = true;
    this.erroIpca = false;

    this.indicadorService.buscarIpca(meses).subscribe({

      next: (dados) => {
        this.ipcaDados = dados;

        this.ipcaAtual = dados.length > 0
          ? dados[dados.length - 1]
          : null;

        this.carregandoIpca = false;
        this.erroIpca = false;

        this.cdr.detectChanges();
      },

      error: (erro) => {
        console.error('Erro ao buscar IPCA:', erro);

        this.erroIpca = true;
        this.carregandoIpca = false;

        this.cdr.detectChanges();
      }

    });

    // SELIC

    this.carregandoSelic = true;
    this.erroSelic = false;

    this.indicadorService.buscarSelic(this.periodoSelecionado).subscribe({

      next: (dados) => {
        this.selicDados = dados;

        this.selicAtual = dados.length > 0
          ? dados[dados.length - 1]
          : null;

        this.carregandoSelic = false;
        this.erroSelic = false;

        this.cdr.detectChanges();
      },

      error: (erro) => {
        console.error('Erro ao buscar Selic:', erro);

        this.erroSelic = true;
        this.carregandoSelic = false;

        this.cdr.detectChanges();
      }

    });

    // CÂMBIO

    this.carregandoCambio = true;
    this.erroCambio = false;

    this.indicadorService.buscarCambio(this.periodoSelecionado).subscribe({

      next: (dados) => {
        this.cambioDados = dados;

        this.cambioAtual = dados.length > 0
          ? dados[0]
          : null;

        this.carregandoCambio = false;
        this.erroCambio = false;

        this.cdr.detectChanges();
      },

      error: (erro) => {
        console.error('Erro ao buscar câmbio:', erro);

        this.erroCambio = true;
        this.carregandoCambio = false;

        this.cdr.detectChanges();
      }

    });
  }
}
