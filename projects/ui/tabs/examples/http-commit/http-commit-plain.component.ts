import { HttpClient, type HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { CngxTab, CngxTabContent, type CngxTabsCommitAction } from '@cngx/common/tabs';
import { CngxTabGroup } from '@cngx/ui/tabs';
import { CngxToastOn, CngxToastOutlet } from '@cngx/ui/feedback';

import { type Section } from './backend';

export { appConfig } from './app.config';

/**
 * Data-driven tabs over a real `HttpClient`, on the cngx default theme (no
 * Material bridge).
 *
 * Identical wiring to the Material variant - tabs loaded from `GET
 * /api/sections`, `[commitAction]` PUTs per switch, **Billing** is refused by
 * the server (409) - but rendered on cngx's own default styling, so it shows the
 * components are fully themed without Material. Needs `provideHttpClient` + an
 * interceptor, so it only works as a runnable playground.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxTabGroup, CngxTab, CngxTabContent, CngxToastOn, CngxToastOutlet],
  styleUrl: './http-commit-plain.component.scss',
  template: `
    @if (sections().length) {
      <cngx-tab-group
        [(activeIndex)]="active"
        [commitAction]="commit"
        commitMode="pessimistic"
        aria-label="Workspace sections"
        cngxToastOn
        toastError="Could not switch section"
        [toastErrorDetail]="true"
      >
        @for (section of sections(); track section.id) {
          <div cngxTab [label]="section.label">
            <ng-template cngxTabContent><p>{{ section.body }}</p></ng-template>
          </div>
        }
      </cngx-tab-group>
    } @else {
      <p class="loading">Loading sections from /api/sections…</p>
    }

    <cngx-toast-outlet />
  `,
})
export class HttpCommitPlainExample {
  private readonly http = inject(HttpClient);
  protected readonly sections = signal<Section[]>([]);
  protected readonly active = signal(0);

  constructor() {
    this.http.get<Section[]>('/api/sections').subscribe((sections) => this.sections.set(sections));
  }

  protected readonly commit: CngxTabsCommitAction = (_from, to) => {
    const target = this.sections()[to];
    return this.http.put(`/api/sections/${target.id}/activate`, {}).pipe(
      map(() => true),
      catchError((err: HttpErrorResponse) =>
        throwError(() => new Error(err.error?.message ?? 'The server refused the switch.')),
      ),
    );
  };
}
