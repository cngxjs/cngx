import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'common',
    children: [
      {
        path: 'behaviors/sort',
        loadComponent: () =>
          import('./demos/common/behaviors/sort-demo/sort-demo.component').then(
            (m) => m.SortDemoComponent,
          ),
      },
      {
        path: 'behaviors/filter',
        loadComponent: () =>
          import('./demos/common/behaviors/filter-demo/filter-demo.component').then(
            (m) => m.FilterDemoComponent,
          ),
      },
      {
        path: 'behaviors/search',
        loadComponent: () =>
          import('./demos/common/behaviors/search-demo/search-demo.component').then(
            (m) => m.SearchDemoComponent,
          ),
      },
      {
        path: 'data/data-source',
        loadComponent: () =>
          import('./demos/common/data/data-source-demo/data-source-demo.component').then(
            (m) => m.DataSourceDemoComponent,
          ),
      },
      {
        path: 'data/smart-data-source',
        loadComponent: () =>
          import(
            './demos/common/data/smart-data-source-demo/smart-data-source-demo.component'
          ).then((m) => m.SmartDataSourceDemoComponent),
      },
      { path: '', redirectTo: 'behaviors/sort', pathMatch: 'full' },
    ],
  },
  {
    path: 'data-display',
    children: [
      {
        path: 'treetable',
        loadComponent: () =>
          import('./demos/data-display/treetable-demo/treetable-demo.component').then(
            (m) => m.TreetableDemoComponent,
          ),
      },
      { path: '', redirectTo: 'treetable', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
