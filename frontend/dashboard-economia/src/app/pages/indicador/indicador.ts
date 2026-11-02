
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { EconomicChart } from '../../components/economic-chart/economic-chart';
import { IndicadorService } from '../../services/indicador.service';

import { CambioResponse } from '../../models/cambio-response';
import { IpcaResponse } from '../../models/ipca-response';
import { SelicResponse } from '../../models/selic-response';
import { PibResponse } from '../../models/pib-response';

type TipoIndicador = 'ipca' | 'selic' | 'pib' | 'cambio';

@Component({
  selector: 'app-indicador',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    EconomicChart
  ],
  templateUrl: './indicador.html',
  styleUrl: './indicador.scss'
})
export class IndicadorPage implements OnInit {

  private route = inject(ActivatedRoute);
  private indicadorService = inject(IndicadorService);
  private cdr = inject(ChangeDetectorRef);

  indicador: TipoIndicador = 'ipca';

  titulo = '';
  descricao = '';
  unidade = '';

  carregando = true;
  erro = false;

  periodoSelecionado = 365;

  ipcaDados: IpcaResponse[] = [];
  selicDados: SelicResponse[] = [];
  pibDados: PibResponse[] = [];
  cambioDados: CambioResponse[] = [];

  ipcaAtual: IpcaResponse | null = null;
  selicAtual: SelicResponse | null = null;
  pibAtual: PibResponse | null = null;
  cambioAtual: CambioResponse | null = null;

  ngOnInit(): void {
    this.indicador = this.route.snapshot.data['indicador'] ?? 'ipca';

    this.configurarIndicador();
    this.carregarDados();
  }

  private configurarIndicador(): void {
    const configuracoes: Record<TipoIndicador, {
      titulo: string;
      descricao: string;
      unidade: string;
    }> = {
      ipca: {
        titulo: 'Inflação (IPCA)',
        descricao: 'Índice Nacional de Preços ao Consumidor Amplo.',
        unidade: '%'
      },
      selic: {
        titulo: 'Taxa Selic',
        descricao: 'Taxa básica de juros da economia brasileira.',
        unidade: '%'
      },
      pib: {
        titulo: 'Produto Interno Bruto',
        descricao: 'Acompanhe a evolução da atividade econômica brasileira.',
        unidade: 'R$ milhões'
      },
      cambio: {
        titulo: 'Câmbio',
        descricao: 'Acompanhe a cotação comercial do dólar americano.',
        unidade: 'R$'
      }
    };

    const config = configuracoes[this.indicador];

    this.titulo = config.titulo;
    this.descricao = config.descricao;
    this.unidade = config.unidade;
  }

  alterarPeriodo(periodo: string): void {
    const dias = Number(periodo);

    if (![30, 90, 180, 365].includes(dias)) {
      return;
    }

    this.periodoSelecionado = dias;
    this.carregarDados();
  }

  private carregarDados(): void {
    this.carregando = true;
    this.erro = false;

    const mesesPorPeriodo: Record<number, number> = {
      30: 1,
      90: 3,
      180: 6,
      365: 12
    };

    const meses = mesesPorPeriodo[this.periodoSelecionado] ?? 12;

    switch (this.indicador) {

      case 'ipca':
        this.indicadorService.buscarIpca(meses).subscribe({
          next: dados => {
            this.ipcaDados = dados;
            this.ipcaAtual = dados.length
              ? dados[dados.length - 1]
              : null;

            this.finalizarCarregamento();
          },
          error: erro => this.tratarErro('IPCA', erro)
        });
        break;

      case 'selic':
        this.indicadorService.buscarSelic(this.periodoSelecionado).subscribe({
          next: dados => {
            this.selicDados = dados;
            this.selicAtual = dados.length
              ? dados[dados.length - 1]
              : null;

            this.finalizarCarregamento();
          },
          error: erro => this.tratarErro('Selic', erro)
        });
        break;

      case 'pib':
        this.indicadorService.buscarPib().subscribe({
          next: dados => {
            this.pibDados = dados;
            this.pibAtual = dados.length ? dados[0] : null;

            this.finalizarCarregamento();
          },
          error: erro => this.tratarErro('PIB', erro)
        });
        break;

      case 'cambio':
        this.indicadorService.buscarCambio(this.periodoSelecionado).subscribe({
          next: dados => {
            this.cambioDados = dados;
            this.cambioAtual = dados.length ? dados[0] : null;

            this.finalizarCarregamento();
          },
          error: erro => this.tratarErro('Câmbio', erro)
        });
        break;
    }
  }

  private finalizarCarregamento(): void {
    this.carregando = false;
    this.erro = false;
    this.cdr.detectChanges();
  }

  private tratarErro(indicador: string, erro: unknown): void {
    console.error(`Erro ao carregar ${indicador}:`, erro);

    this.carregando = false;
    this.erro = true;

    this.cdr.detectChanges();
  }

  get valorAtual(): number | null {
    switch (this.indicador) {
      case 'ipca':
        return this.ipcaAtual?.valor ?? null;

      case 'selic':
        return this.selicAtual?.valor ?? null;

      case 'pib':
        return this.pibAtual?.valorNominal ?? null;

      case 'cambio':
        return this.cambioAtual?.venda ?? null;
    }
  }

  get referenciaAtual(): string {
    switch (this.indicador) {
      case 'ipca':
        return this.ipcaAtual?.periodoFormatado ?? '--';

      case 'selic':
        return this.selicAtual?.dataFormatada ?? '--';

      case 'pib':
        return this.pibAtual?.periodoFormatado ?? '--';

      case 'cambio':
        return this.cambioAtual?.data ?? '--';
    }
  }
}
