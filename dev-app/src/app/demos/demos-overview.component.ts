import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-demos-overview',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overview">
      <header class="overview-header">
        <h1 class="overview-title">Demos</h1>
        <p class="overview-desc">
          Interactive examples for every directive, component, and utility in the cngx library.
          Each demo is a self-contained showcase with live controls and code context.
        </p>
      </header>

      <div class="card-grid">
        @for (lib of libraries; track lib.name) {
          <a class="lib-card" [routerLink]="lib.link">
            <span class="lib-name">{{ lib.name }}</span>
            <p class="lib-desc">{{ lib.description }}</p>
            <div class="lib-tags">
              @for (tag of lib.tags; track tag) {
                <span class="lib-tag">{{ tag }}</span>
              }
            </div>
          </a>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .overview {
        max-width: 780px;
      }

      .overview-header {
        margin-bottom: 2.5rem;
      }

      .overview-title {
        font-family: var(--font-display);
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: var(--text-primary);
        margin-bottom: 0.75rem;
      }

      .overview-desc {
        font-size: 0.9375rem;
        color: var(--text-muted);
        line-height: 1.65;
        max-width: 560px;
      }

      .card-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .lib-card {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1.25rem 1.5rem;
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 6px;
        text-decoration: none;
        transition:
          border-color 0.2s,
          box-shadow 0.2s,
          transform 0.2s;
        cursor: pointer;

        &:hover {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent),
            0 6px 24px -6px rgba(245, 166, 35, 0.12);
          transform: translateY(-1px);
        }
      }

      .lib-name {
        font-family: var(--font-display);
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: -0.01em;
      }

      .lib-desc {
        font-size: 0.8125rem;
        color: var(--text-muted);
        line-height: 1.55;
      }

      .lib-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        margin-top: 0.25rem;
      }

      .lib-tag {
        font-size: 0.6875rem;
        font-weight: 600;
        padding: 0.1875rem 0.4375rem;
        background: rgba(245, 166, 35, 0.1);
        color: var(--accent);
        border-radius: 3px;
        letter-spacing: 0.01em;
      }
    `,
  ],
})
export class DemosOverviewComponent {
  readonly libraries = [
    {
      name: '@cngx/common',
      description:
        'Headless behavior directives -- sort, filter, search, paginate, a11y, layout observers, and DataSource utilities. Signal-first, no template opinion.',
      tags: ['Sort', 'Filter', 'Search', 'Paginate', 'A11y', 'DataSource'],
      link: '/common/a11y/aria-expanded',
    },
    {
      name: '@cngx/data-display',
      description:
        'Hierarchical data tables with CDK and Material variants. Treetable with selection, keyboard navigation, sort, filter, and search integration.',
      tags: ['Treetable', 'CDK', 'Material'],
      link: '/data-display/treetable',
    },
    {
      name: '@cngx/ui',
      description:
        'Finished UI composites built on top of common and CDK. Material paginator wrapper, speak button, and more.',
      tags: ['MatPaginator', 'SpeakButton'],
      link: '/ui/mat-paginator',
    },
  ];
}
