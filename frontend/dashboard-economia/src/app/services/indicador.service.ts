import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CambioResponse } from '../models/cambio-response';
import { PibResponse } from '../models/pib-response';
import { IpcaResponse } from '../models/ipca-response';
import { SelicResponse } from '../models/selic-response';

@Injectable({
  providedIn: 'root'
})
export class IndicadorService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/v1/indicadores';

  buscarIpca(meses: number = 24): Observable<IpcaResponse[]> {
    return this.http.get<IpcaResponse[]>(
      `${this.apiUrl}/ipca?meses=${meses}`
    );
  }

  buscarSelic(dias: number = 30): Observable<SelicResponse[]> {
    return this.http.get<SelicResponse[]>(
      `${this.apiUrl}/selic?dias=${dias}`
    );
  }
  buscarPib(): Observable<PibResponse[]> {
    return this.http.get<PibResponse[]>(
      `${this.apiUrl}/pib`
    );
  }

  buscarCambio(dias: number = 30): Observable<CambioResponse[]> {
    return this.http.get<CambioResponse[]>(
        `${this.apiUrl}/cambio?dias=${dias}`
    );
  }
}
