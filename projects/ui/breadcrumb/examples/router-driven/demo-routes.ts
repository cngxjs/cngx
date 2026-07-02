import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type Routes } from '@angular/router';

/**
 * One page component reused for every city. `withComponentInputBinding()`
 * (wired in app.config.ts) binds the route's `data.breadcrumb` to the
 * `breadcrumb` input, so navigating between siblings reuses this instance
 * and just re-flows the input - no per-city component needed.
 */
@Component({
  selector: 'demo-city',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 style="margin-top: 0">{{ breadcrumb() }}</h2>
    <p style="opacity: 0.75; margin-bottom: 0">
      You are on the {{ breadcrumb() }} page. Open the sibling dropdown in the
      trail to see the other cities at this level, with {{ breadcrumb() }}
      marked as the current page.
    </p>
  `,
})
export class CityPage {
  /** Bound from the route's `data.breadcrumb` via `withComponentInputBinding()`. */
  readonly breadcrumb = input('');
}

/**
 * A nested tree: the componentless `eu` grouping route carries three city
 * children, each annotated with `data.breadcrumb`. This is the shape the
 * sibling dropdown reads at `[depth]="1"` - the children of the active
 * route's parent.
 */
export const ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'eu/berlin' },
  {
    path: 'eu',
    data: { breadcrumb: 'Region EU' },
    children: [
      { path: 'munich', component: CityPage, data: { breadcrumb: 'Munich' } },
      { path: 'berlin', component: CityPage, data: { breadcrumb: 'Berlin' } },
      { path: 'hamburg', component: CityPage, data: { breadcrumb: 'Hamburg' } },
    ],
  },
];
