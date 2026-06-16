import { HttpClient, type HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { CngxTab, CngxTabContent, type CngxTabsCommitAction } from '@cngx/common/tabs';
import { CngxTabGroup } from '@cngx/ui/tabs';
import { CngxToastOn, CngxToastOutlet } from '@cngx/ui/feedback';

import { type Section } from './backend';

// Re-export ships app.config.ts (HttpClient + fake-backend interceptor) into
// the StackBlitz manifest.
export { appConfig } from './app.config';

/**
 * Data-driven tabs over a real `HttpClient`, Material-themed.
 *
 * The tab set is loaded from `GET /api/sections`, and `[commitAction]` issues a
 * real `PUT /api/sections/<id>/activate` per switch - so the busy spinner and
 * the rejection decoration are driven by genuine async HTTP, not a `setTimeout`.
 * Switching to **Billing** is refused by the server (409): pessimistic mode
 * keeps the active tab put and the rejection icon lights up. This needs
 * `provideHttpClient` + an interceptor, so it only works as a runnable
 * playground - not as a static `<example-url>` story.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxTabGroup, CngxTab, CngxTabContent, CngxToastOn, CngxToastOutlet],
  styleUrl: './http-commit-material.component.scss',
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
export class HttpCommitMaterialExample {
  private readonly http = inject(HttpClient);
  protected readonly sections = signal<Section[]>([]);
  protected readonly active = signal(0);

  constructor() {
    this.http.get<Section[]>('/api/sections').subscribe((sections) => this.sections.set(sections));
  }

  /**
   * Commit a switch by PUT-ing to the API; a non-2xx response rejects it. The
   * `HttpErrorResponse` is mapped to a plain `Error` carrying the server's
   * business message so `cngxToastOn` (with `toastErrorDetail`) surfaces it.
   */
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
