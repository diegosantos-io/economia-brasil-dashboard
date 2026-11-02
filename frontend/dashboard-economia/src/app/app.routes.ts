
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard')
        .then(m => m.Dashboard)
  },
  {
    path: 'ipca',
    loadComponent: () =>
      import('./pages/indicador/indicador')
        .then(m => m.IndicadorPage),
    data: { indicador: 'ipca' }
  },
  {
    path: 'selic',
    loadComponent: () =>
      import('./pages/indicador/indicador')
        .then(m => m.IndicadorPage),
    data: { indicador: 'selic' }
  },
  {
    path: 'pib',
    loadComponent: () =>
      import('./pages/indicador/indicador')
        .then(m => m.IndicadorPage),
    data: { indicador: 'pib' }
  },
  {
    path: 'cambio',
    loadComponent: () =>
      import('./pages/indicador/indicador')
        .then(m => m.IndicadorPage),
    data: { indicador: 'cambio' }
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
