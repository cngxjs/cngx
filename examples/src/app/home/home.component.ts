import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROUTES_META } from '../_routes-meta';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>cngx examples</h1>
    <p>Placeholder home — filterable tree comes next.</p>
    <ul>
      @for (r of routes; track r.path) {
        <li><a [routerLink]="['/', ...r.path.split('/')]">{{ r.lib }} / {{ r.category }} / {{ r.demo }} — {{ r.section }}</a></li>
      }
    </ul>
  `,
})
export class HomeComponent {
  protected readonly routes = ROUTES_META;
}
