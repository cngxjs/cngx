import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'active-descendant/listbox',
    loadComponent: () =>
      import('./features/active-descendant/listbox.component').then(
        (m) => m.ActiveDescendantListbox,
      ),
    data: { lib: 'common', category: 'a11y', demo: 'Active Descendant', section: 'Listbox' },
  },
  {
    path: 'active-descendant/typeahead',
    loadComponent: () =>
      import('./features/active-descendant/typeahead.component').then(
        (m) => m.ActiveDescendantTypeahead,
      ),
    data: { lib: 'common', category: 'a11y', demo: 'Active Descendant', section: 'Typeahead' },
  },
];
