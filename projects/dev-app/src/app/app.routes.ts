import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'treetable',
    loadComponent: () =>
      import('./demos/treetable-demo/treetable-demo.component').then(
        (m) => m.TreetableDemoComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
