import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-example-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="example-card">
      <header class="example-header">
        <h2 class="example-title">{{ title() }}</h2>
        @if (subtitle()) {
          <p class="example-subtitle" [innerHTML]="subtitle()"></p>
        }
      </header>
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
}
