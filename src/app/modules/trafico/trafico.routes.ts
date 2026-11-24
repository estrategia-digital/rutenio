import { Routes } from '@angular/router';

export default [
  {
    path: '',
    redirectTo: 'lista',
    pathMatch: 'full',
  },
  {
    path: 'lista',
    loadComponent: () =>
      import('./componentes/trafico-lista/trafico-lista.component'),
  },
  {
    path: 'satrack',
    loadComponent: () =>
      import('../satrack/components/satrack-mapa/satrack-mapa.component'),
  }
] as Routes;
