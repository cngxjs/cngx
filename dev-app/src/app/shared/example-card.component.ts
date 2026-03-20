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
        border-left: 2px solid var(--accent);
        border-radius: 10px;
        box-shadow: var(--card-shadow);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        margin-bottom: 1.5rem;
      }

      .example-header {
        padding: 1.125rem 1.5rem 1rem;
        border-bottom: 1px solid var(--card-border);
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .example-title {
        font-size: 1.0625rem;
        font-weight: 650;
        letter-spacing: -0.02em;
        color: var(--card-title);
        line-height: 1.25;
      }

      .example-subtitle {
        font-size: 0.8125rem;
        color: var(--text-muted);
        line-height: 1.6;

        ::ng-deep code {
          background: var(--code-bg);
          color: var(--code-text);
          border: 1px solid var(--code-border);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.8125em;
          font-style: normal;
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
