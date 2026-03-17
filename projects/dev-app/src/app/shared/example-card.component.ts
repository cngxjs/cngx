import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-example-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="example-card">
      <header>
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
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      header {
        border-bottom: 1px solid #f0f0f0;
        padding-bottom: 1rem;
        margin-bottom: 0.5rem;
      }

      .example-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #333;
      }

      .example-subtitle {
        margin: 0.5rem 0 0;
        color: #666;
        font-size: 0.95rem;
        line-height: 1.5;

        // Apply styles to <code> within the innerHTML
        ::ng-deep code {
          background: #f5f5f5;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family:
            'SF Mono',
            Monaco,
            Inconsolata,
            'Fira Mono',
            'Droid Sans Mono',
            'Source Code Pro',
            monospace;
          font-size: 0.85em;
          color: #d63384;
          border: 1px solid #e0e0e0;
        }
      }

      .example-content {
        overflow-x: auto;
      }
    `,
  ],
})
export class ExampleCardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
