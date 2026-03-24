import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

type SourceTab = 'html' | 'ts' | 'css';

@Component({
  selector: 'app-example-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="example-card">
      <header class="example-header">
        <div class="example-header-row">
          <h2 class="example-title">{{ title() }}</h2>
          @if (hasSource()) {
            <button class="source-toggle"
                    [class.source-toggle--active]="showSource()"
                    (click)="showSource.set(!showSource())"
                    [attr.aria-expanded]="showSource()"
                    aria-label="View source code"
                    title="View source">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
          }
        </div>
        @if (subtitle()) {
          <p class="example-subtitle" [innerHTML]="subtitle()"></p>
        }
      </header>
      @if (showSource()) {
        <div class="source-panel">
          <div class="source-tabs" role="tablist">
            @for (tab of visibleTabs(); track tab) {
              <button class="source-tab"
                      [class.source-tab--active]="activeSourceTab() === tab"
                      role="tab"
                      [attr.aria-selected]="activeSourceTab() === tab"
                      (click)="activeSourceTab.set(tab)">
                {{ tab.toUpperCase() }}
              </button>
            }
          </div>
          <pre class="source-code"><code>{{ activeSourceContent() }}</code></pre>
        </div>
      }
      <div class="example-content">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  styles: [
    `
      .example-card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        margin-bottom: 1.75rem;
        transition:
          border-color 0.25s,
          box-shadow 0.25s,
          transform 0.25s;

        &:hover {
          border-color: var(--accent);
          box-shadow:
            0 0 0 1px var(--accent),
            0 8px 32px -8px rgba(245, 166, 35, 0.12);
          transform: translateY(-2px);

          .example-title::before {
            height: 100%;
          }
        }
      }

      .example-header {
        padding: 1.25rem 1.5rem 1rem;
        border-bottom: 1px solid var(--card-border);
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        position: relative;
        background: linear-gradient(
          135deg,
          rgba(245, 166, 35, 0.04) 0%,
          transparent 50%
        );
      }

      .example-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .example-title {
        font-family: var(--font-display);
        font-size: 1.125rem;
        font-weight: 700;
        letter-spacing: -0.025em;
        color: var(--card-title);
        line-height: 1.3;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        &::before {
          content: '';
          width: 3px;
          height: 0.75em;
          background: var(--accent);
          border-radius: 2px;
          flex-shrink: 0;
          transition: height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      }

      .source-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid var(--card-border);
        border-radius: 6px;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        transition: all 0.15s;
        flex-shrink: 0;

        &:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: rgba(245, 166, 35, 0.06);
        }

        &--active {
          color: var(--accent);
          border-color: var(--accent);
          background: rgba(245, 166, 35, 0.1);
        }
      }

      .example-subtitle {
        font-size: 0.8125rem;
        color: var(--text-muted);
        line-height: 1.6;
        padding-left: calc(3px + 0.5rem);

        ::ng-deep code {
          background: var(--code-bg);
          color: var(--code-text);
          border: 1px solid var(--code-border);
          padding: 0.125rem 0.375rem;
          border-radius: 3px;
          font-family: var(--font-mono);
          font-size: 0.8125em;
          font-style: normal;
          transition: background 0.15s;
        }

        &:hover ::ng-deep code {
          background: color-mix(in srgb, var(--code-bg) 80%, var(--accent) 20%);
        }
      }

      .source-panel {
        border-bottom: 1px solid var(--card-border);
        background: var(--code-bg, #1e1e2e);
        max-height: 400px;
        overflow: auto;
      }

      .source-tabs {
        display: flex;
        gap: 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding: 0 1rem;
      }

      .source-tab {
        padding: 0.5rem 0.75rem;
        font-family: var(--font-mono);
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        color: rgba(255, 255, 255, 0.4);
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          color: rgba(255, 255, 255, 0.7);
        }

        &--active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }
      }

      .source-code {
        margin: 0;
        padding: 1rem 1.5rem;
        font-family: var(--font-mono);
        font-size: 0.8125rem;
        line-height: 1.7;
        color: var(--code-text, #cdd6f4);
        white-space: pre-wrap;
        word-break: break-word;
        tab-size: 2;
      }

      .example-content {
        padding: 1.25rem 1.5rem;
        overflow-x: auto;
      }
    `,
  ],
})
export class ExampleCardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');

  /** @deprecated Use sourceHtml instead. Kept for backward compat. */
  readonly source = input('');
  readonly sourceHtml = input('');
  readonly sourceTs = input('');
  readonly sourceCss = input('');

  readonly showSource = signal(false);
  readonly activeSourceTab = signal<SourceTab>('html');

  protected readonly hasSource = computed(
    () => !!(this.source() || this.sourceHtml() || this.sourceTs() || this.sourceCss()),
  );

  protected readonly visibleTabs = computed<SourceTab[]>(() => {
    const tabs: SourceTab[] = [];
    if (this.source() || this.sourceHtml()) {
      tabs.push('html');
    }
    if (this.sourceTs()) {
      tabs.push('ts');
    }
    if (this.sourceCss()) {
      tabs.push('css');
    }
    return tabs;
  });

  protected readonly activeSourceContent = computed(() => {
    switch (this.activeSourceTab()) {
      case 'html':
        return this.sourceHtml() || this.source();
      case 'ts':
        return this.sourceTs();
      case 'css':
        return this.sourceCss();
    }
  });
}
