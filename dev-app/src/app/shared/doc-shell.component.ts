import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiDataService } from './api-data.service';
import { ApiTableComponent } from './api-table.component';

type DocTab = 'overview' | 'examples' | 'api';

const TABS: { id: DocTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'examples', label: 'Examples' },
  { id: 'api', label: 'API' },
];

@Component({
  selector: 'app-doc-shell',
  standalone: true,
  imports: [ApiTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="doc-header">
      <h1 class="doc-title">{{ title() }}</h1>
      @if (description()) {
        <p class="doc-description" [innerHTML]="description()"></p>
      }
    </header>

    <nav class="doc-tabs" role="tablist" aria-label="Documentation sections"
         (keydown)="handleTabKeydown($event)">
      @for (tab of tabs; track tab.id; let i = $index) {
        <button class="doc-tab"
                [class.doc-tab--active]="activeTab() === tab.id"
                role="tab"
                [id]="'tab-' + tab.id"
                [attr.aria-selected]="activeTab() === tab.id"
                [attr.aria-controls]="'panel-' + tab.id"
                [attr.tabindex]="activeTab() === tab.id ? 0 : -1"
                (click)="setTab(tab.id)"
                (focus)="focusedIndex.set(i)">
          {{ tab.label }}
        </button>
      }
    </nav>

    @switch (activeTab()) {
      @case ('overview') {
        <div class="doc-panel" role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
          @if (overview()) {
            <div class="doc-overview" [innerHTML]="overview()"></div>
          } @else if (description()) {
            <div class="doc-overview" [innerHTML]="description()"></div>
          } @else {
            <p class="doc-empty">No overview available.</p>
          }
          <ng-content select="[docOverview]"></ng-content>
        </div>
      }
      @case ('examples') {
        <div class="doc-panel" role="tabpanel" id="panel-examples" aria-labelledby="tab-examples">
          <ng-content></ng-content>
        </div>
      }
      @case ('api') {
        <div class="doc-panel" role="tabpanel" id="panel-api" aria-labelledby="tab-api">
          <app-api-table [entries]="apiEntries()" />
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .doc-header {
        margin-bottom: 1.5rem;
      }

      .doc-title {
        font-family: var(--font-display);
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: var(--text-primary);
        margin: 0 0 0.5rem;
        line-height: 1.2;
      }

      .doc-description {
        font-size: 0.9375rem;
        color: var(--text-muted);
        line-height: 1.6;
        margin: 0;
        max-width: 60ch;

        :host ::ng-deep code {
          background: var(--code-bg);
          color: var(--code-text);
          border: 1px solid var(--code-border);
          padding: 0.125rem 0.375rem;
          border-radius: 3px;
          font-family: var(--font-mono);
          font-size: 0.875em;
        }
      }

      .doc-tabs {
        display: flex;
        gap: 0;
        border-bottom: 2px solid var(--card-border);
        margin-bottom: 1.5rem;
      }

      .doc-tab {
        padding: 0.75rem 1.25rem;
        font-family: var(--font-sans);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-muted);
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;

        &:hover {
          color: var(--text-primary);
          background: rgba(245, 166, 35, 0.04);
        }

        &:focus-visible {
          outline: 2px solid var(--focus-ring, var(--accent));
          outline-offset: -2px;
          border-radius: 4px 4px 0 0;
        }

        &--active {
          color: var(--accent);
          border-bottom-color: var(--accent);
          font-weight: 600;
        }
      }

      .doc-panel {
        min-height: 200px;
      }

      .doc-overview {
        font-size: 0.9375rem;
        line-height: 1.8;
        color: var(--text-primary);
        max-width: 70ch;

        :host ::ng-deep {
          h2,
          h3,
          h4 {
            font-family: var(--font-display);
            margin: 1.5rem 0 0.5rem;
          }

          code {
            background: var(--code-bg);
            color: var(--code-text);
            border: 1px solid var(--code-border);
            padding: 0.125rem 0.375rem;
            border-radius: 3px;
            font-family: var(--font-mono);
            font-size: 0.875em;
          }

          pre {
            background: var(--code-bg, #1e1e2e);
            color: var(--code-text, #cdd6f4);
            padding: 1rem 1.25rem;
            border-radius: 6px;
            overflow-x: auto;
            font-family: var(--font-mono);
            font-size: 0.8125rem;
            line-height: 1.7;
          }
        }
      }

      .doc-empty {
        color: var(--text-muted);
        font-size: 0.875rem;
        padding: 2rem 0;
      }
    `,
  ],
})
export class DocShellComponent {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly overview = input('');
  readonly apiComponents = input<string[]>([]);

  protected readonly tabs = TABS;
  protected readonly focusedIndex = signal(0);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiDataService);

  // Read fragment from URL (#overview, #examples, #api)
  private readonly fragment = toSignal(this.route.fragment, { initialValue: null });

  readonly activeTab = computed<DocTab>(() => {
    const f = this.fragment();
    return f && TABS.some((t) => t.id === f) ? (f as DocTab) : 'examples';
  });

  readonly apiEntries = computed(() => {
    const names = this.apiComponents();
    return names.length > 0 ? this.apiService.getEntries(names)() : [];
  });

  protected setTab(tab: DocTab): void {
    this.router.navigate([], {
      relativeTo: this.route,
      fragment: tab,
      replaceUrl: true,
    });
  }

  protected handleTabKeydown(event: KeyboardEvent): void {
    const idx = this.focusedIndex();
    let next: number;

    switch (event.key) {
      case 'ArrowRight':
        next = (idx + 1) % TABS.length;
        break;
      case 'ArrowLeft':
        next = (idx - 1 + TABS.length) % TABS.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = TABS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.focusedIndex.set(next);
    this.setTab(TABS[next].id);

    const btn = (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]')[next];
    btn?.focus();
  }
}
