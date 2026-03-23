import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ApiEntry } from './api-types';

@Component({
  selector: 'app-api-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (entry of entries(); track entry.name) {
      <div class="api-entry">
        <h3 class="api-entry-name">{{ entry.name }}</h3>
        @if (entry.selector) {
          <p class="api-meta">
            <span class="api-label">Selector:</span>
            <code>{{ entry.selector }}</code>
            @if (entry.exportAs) {
              <span class="api-label api-label--spaced">Export as:</span>
              <code>{{ entry.exportAs }}</code>
            }
          </p>
        }
        @if (entry.description) {
          <p class="api-description">{{ entry.description }}</p>
        }

        @if (entry.inputs.length) {
          <h4 class="api-section-title">Inputs</h4>
          <div class="api-table-wrap">
            <table class="api-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                @for (inp of entry.inputs; track inp.name) {
                  <tr>
                    <td><code>{{ inp.name }}</code>@if (inp.required) { <span class="api-required">*</span> }</td>
                    <td><code class="api-type">{{ inp.type }}</code></td>
                    <td>{{ inp.defaultValue || '-' }}</td>
                    <td>{{ inp.description }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (entry.outputs.length) {
          <h4 class="api-section-title">Outputs</h4>
          <div class="api-table-wrap">
            <table class="api-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                @for (out of entry.outputs; track out.name) {
                  <tr>
                    <td><code>{{ out.name }}</code></td>
                    <td><code class="api-type">{{ out.type }}</code></td>
                    <td>{{ out.description }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (entry.methods.length) {
          <h4 class="api-section-title">Methods</h4>
          <div class="api-table-wrap">
            <table class="api-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Signature</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                @for (method of entry.methods; track method.name) {
                  <tr>
                    <td><code>{{ method.name }}</code></td>
                    <td><code class="api-type">({{ method.args }}) => {{ method.returnType }}</code></td>
                    <td>{{ method.description }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    } @empty {
      <p class="api-empty">No API documentation available. Run <code>npm run docs:json</code> to generate.</p>
    }
  `,
  styles: [
    `
      .api-entry {
        margin-bottom: 2rem;
      }

      .api-entry-name {
        font-family: var(--font-mono);
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--card-title);
        margin: 0 0 0.5rem;
      }

      .api-meta {
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin: 0 0 0.75rem;

        code {
          background: var(--code-bg);
          color: var(--code-text);
          border: 1px solid var(--code-border);
          padding: 0.125rem 0.375rem;
          border-radius: 3px;
          font-family: var(--font-mono);
          font-size: 0.9em;
        }
      }

      .api-label {
        font-weight: 600;
        margin-right: 0.25rem;

        &--spaced {
          margin-left: 1rem;
        }
      }

      .api-description {
        font-size: 0.875rem;
        color: var(--text-primary);
        line-height: 1.6;
        margin: 0 0 1rem;
      }

      .api-section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 1.25rem 0 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .api-table-wrap {
        overflow-x: auto;
        margin-bottom: 0.5rem;
      }

      .api-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;

        th {
          text-align: left;
          padding: 0.5rem 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          border-bottom: 2px solid var(--card-border);
          white-space: nowrap;
        }

        td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--card-border);
          vertical-align: top;
          line-height: 1.5;
        }

        code {
          font-family: var(--font-mono);
          font-size: 0.9em;
        }

        .api-type {
          color: var(--accent);
        }

        .api-required {
          color: var(--accent);
          font-weight: 700;
          margin-left: 2px;
        }

        tr:last-child td {
          border-bottom: none;
        }
      }

      .api-empty {
        color: var(--text-muted);
        font-size: 0.875rem;
        padding: 2rem 0;

        code {
          background: var(--code-bg);
          padding: 0.125rem 0.375rem;
          border-radius: 3px;
          font-family: var(--font-mono);
        }
      }
    `,
  ],
})
export class ApiTableComponent {
  readonly entries = input<ApiEntry[]>([]);
}
