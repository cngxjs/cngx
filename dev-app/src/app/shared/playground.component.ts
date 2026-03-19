import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  type Playground,
  type PlaygroundControl,
  type SelectControl,
  type RangeControl,
} from './playground';

@Component({
  selector: 'app-playground',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="playground">
      <div class="playground-preview">
        <ng-content></ng-content>
      </div>

      @if (playground().controls.length > 0) {
        <div class="playground-bar">
          <span class="bar-label">Props</span>
          <div class="bar-controls">
            @for (ctrl of playground().controls; track ctrl.label) {
              <div class="ctrl">
                <span class="ctrl-label">{{ ctrl.label }}</span>

                @switch (ctrl.type) {
                  @case ('boolean') {
                    <button
                      class="toggle"
                      [class.toggle--on]="ctrl.value()"
                      (click)="setValue(ctrl, !ctrl.value())"
                      role="switch"
                      [attr.aria-checked]="ctrl.value()"
                      [attr.aria-label]="ctrl.label"
                    >
                      <span class="toggle-thumb"></span>
                    </button>
                  }

                  @case ('select') {
                    <div class="seg">
                      @for (opt of asSelect(ctrl).options; track opt.label) {
                        <button
                          class="seg-btn"
                          [class.seg-btn--active]="opt.value === ctrl.value()"
                          (click)="setValue(ctrl, opt.value)"
                        >
                          {{ opt.label }}
                        </button>
                      }
                    </div>
                  }

                  @case ('text') {
                    <input
                      class="ctl-text"
                      type="text"
                      [value]="ctrl.value()"
                      [attr.placeholder]="$any(ctrl).placeholder ?? null"
                      (input)="setValue(ctrl, inputVal($event))"
                    />
                  }

                  @case ('number') {
                    <input
                      class="ctl-number"
                      type="number"
                      [value]="ctrl.value()"
                      [attr.min]="$any(ctrl).min ?? null"
                      [attr.max]="$any(ctrl).max ?? null"
                      [attr.step]="$any(ctrl).step ?? 1"
                      (input)="setValue(ctrl, +inputVal($event))"
                    />
                  }

                  @case ('range') {
                    <div class="ctl-range-wrap">
                      <input
                        class="ctl-range"
                        type="range"
                        [value]="ctrl.value()"
                        [attr.min]="asRange(ctrl).min"
                        [attr.max]="asRange(ctrl).max"
                        [attr.step]="asRange(ctrl).step ?? 1"
                        (input)="setValue(ctrl, +inputVal($event))"
                      />
                      <span class="range-val">{{ ctrl.value() }}</span>
                    </div>
                  }
                }

                @if (ctrl.description) {
                  <span class="ctrl-desc">{{ ctrl.description }}</span>
                }
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .playground {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-top: 2px solid var(--accent);
        border-radius: 12px;
        box-shadow: var(--card-shadow);
        overflow: hidden;
        margin-bottom: 2rem;
      }

      .playground-preview {
        padding: 1.5rem;
        overflow-x: auto;
      }

      // ── Controls bar ──────────────────────────────────────────────────────

      .playground-bar {
        display: flex;
        flex-direction: column;
        background: var(--pg-bar-bg);
        border-top: 1px solid var(--pg-bar-border);
      }

      .bar-label {
        font-size: 0.625rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--pg-bar-label);
        font-family: var(--font-mono);
        padding: 0.5rem 1.25rem;
        border-bottom: 1px solid var(--pg-bar-divider);
      }

      .bar-controls {
        display: flex;
        flex-wrap: wrap;
        background: var(--pg-bar-divider);
        gap: 1px;
      }

      .ctrl {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.375rem;
        padding: 0.75rem 1.375rem;
        background: var(--pg-bar-bg);
        flex: 0 0 auto;

        @media (max-width: 480px) {
          flex: 1 1 100%;
        }
      }

      .ctrl-label {
        font-size: 0.625rem;
        font-family: var(--font-mono);
        color: var(--pg-ctrl-label);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .ctrl-desc {
        font-size: 0.625rem;
        color: var(--pg-ctrl-desc);
        max-width: 14rem;
        line-height: 1.5;
        font-family: var(--font-mono);
      }

      // ── Toggle ────────────────────────────────────────────────────────────

      .toggle {
        position: relative;
        width: 2.25rem;
        height: 1.125rem;
        background: var(--pg-toggle-bg);
        border: 1px solid var(--pg-toggle-border);
        border-radius: 999px;
        cursor: pointer;
        padding: 0;
        transition:
          background 0.18s ease,
          border-color 0.18s ease,
          box-shadow 0.18s ease;
        flex-shrink: 0;

        &.toggle--on {
          background: var(--accent);
          border-color: var(--accent);
          box-shadow: 0 0 10px rgba(245, 166, 35, 0.3);

          .toggle-thumb {
            transform: translateY(-50%) translateX(1.125rem);
          }
        }

        &:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
      }

      .toggle-thumb {
        position: absolute;
        top: 50%;
        left: 0.1875rem;
        transform: translateY(-50%);
        width: 0.6875rem;
        height: 0.6875rem;
        background: #fff;
        border-radius: 50%;
        transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        pointer-events: none;
      }

      // ── Segmented control ─────────────────────────────────────────────────

      .seg {
        display: flex;
        background: var(--pg-seg-bg);
        border: 1px solid var(--pg-seg-border);
        border-radius: 6px;
        overflow: hidden;
        gap: 0;
      }

      .seg-btn {
        font-family: var(--font-mono);
        font-size: 0.75rem;
        color: var(--pg-seg-btn-color);
        background: transparent;
        border: none;
        border-right: 1px solid var(--pg-seg-border);
        padding: 0.3rem 0.75rem;
        cursor: pointer;
        transition:
          color 0.12s,
          background 0.12s;
        white-space: nowrap;
        line-height: 1;

        &:last-child {
          border-right: none;
        }

        &:hover:not(.seg-btn--active) {
          color: var(--pg-seg-btn-hover-color);
          background: var(--pg-seg-btn-hover-bg);
        }

        &.seg-btn--active {
          background: var(--accent);
          color: #fff;
          font-weight: 600;
        }
      }

      // ── Text / Number ─────────────────────────────────────────────────────

      .ctl-text,
      .ctl-number {
        background: var(--pg-input-bg);
        border: 1px solid var(--pg-input-border);
        border-radius: 6px;
        color: var(--pg-input-color);
        font-family: var(--font-mono);
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        width: 8rem;

        &:focus {
          outline: none;
          border-color: var(--accent);
        }
      }

      .ctl-number {
        width: 5rem;
      }

      // ── Range ─────────────────────────────────────────────────────────────

      .ctl-range-wrap {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .ctl-range {
        width: 7rem;
        accent-color: var(--accent);
        cursor: pointer;
      }

      .range-val {
        font-family: var(--font-mono);
        font-size: 0.6875rem;
        color: rgba(255, 255, 255, 0.5);
        min-width: 1.75rem;
        text-align: right;
      }
    `,
  ],
})
export class PlaygroundComponent {
  readonly playground = input.required<Playground>();

  asSelect(ctrl: PlaygroundControl): SelectControl {
    return ctrl as SelectControl;
  }

  asRange(ctrl: PlaygroundControl): RangeControl {
    return ctrl as RangeControl;
  }

  inputVal(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  /** Single write point — avoids the `never` intersection from the union type. */
  setValue(ctrl: PlaygroundControl, value: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctrl.value as any).set(value);
  }
}
