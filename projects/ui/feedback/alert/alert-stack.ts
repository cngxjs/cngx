import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  ViewEncapsulation,
} from '@angular/core';

import { CngxCloseButton } from '@cngx/common/interactive';

import { CNGX_FEEDBACK_CONFIG } from '../config/feedback-config';
import { CngxSeverityIcon } from '../config/severity-icon';
import { CngxAlerter, type AlertState } from './alerter.service';

/**
 * Scoped alert stack — renders alerts from its own `CngxAlerter` instance.
 *
 * Provides `CngxAlerter` via `viewProviders` — child components that
 * `inject(CngxAlerter)` get this stack's instance. Supports nesting
 * (each stack is independent).
 *
 * ### In a dialog
 * ```html
 * <dialog cngxDialog [submitAction]="save">
 *   <header cngxDialogTitle>Edit user</header>
 *   <cngx-alert-stack scope="user-form" position="top" />
 *   <form>...</form>
 * </dialog>
 * ```
 *
 * ### Programmatic usage
 * ```typescript
 * private readonly alerter = inject(CngxAlerter);
 *
 * handleErrors(errors: string[]) {
 *   this.alerter.dismissAll();
 *   errors.forEach(e => this.alerter.show({ message: e, severity: 'error' }));
 * }
 * ```
 * <example-url>http://localhost:4200/#/ui/feedback/alert-stack/basic-stack</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/alert-stack/dialog-use-case</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/alert-stack/overflow-collapse</example-url>
 */
@Component({
  selector: 'cngx-alert-stack',
  standalone: true,
  imports: [NgComponentOutlet, CngxCloseButton, CngxSeverityIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [CngxAlerter],
  host: {
    class: 'cngx-alert-stack',
    role: 'log',
    'aria-live': 'polite',
    '[class.cngx-alert-stack--reserve-space]': 'reserveSpace()',
  },
  template: `
    @for (alert of visibleAlerts(); track alert.id) {
      <div
        [id]="'cngx-alert-' + alert.id"
        class="cngx-alert-stack__item"
        [class.cngx-alert-stack__item--info]="alert.config.severity === 'info'"
        [class.cngx-alert-stack__item--success]="alert.config.severity === 'success'"
        [class.cngx-alert-stack__item--warning]="alert.config.severity === 'warning'"
        [class.cngx-alert-stack__item--error]="alert.config.severity === 'error'"
        [attr.role]="
          alert.config.severity === 'error' || alert.config.severity === 'warning'
            ? 'alert'
            : 'status'
        "
      >
        <div class="cngx-alert-stack__icon">
          @if (iconFor(alert); as iconCmp) {
            <ng-container *ngComponentOutlet="iconCmp" />
          } @else {
            <cngx-severity-icon
              [severity]="alert.config.severity"
              iconClass="cngx-alert-stack__default-icon"
            />
          }
        </div>
        <div class="cngx-alert-stack__body">
          @if (alert.config.title) {
            <strong class="cngx-alert-stack__title">{{ alert.config.title }}</strong>
          }
          <span class="cngx-alert-stack__message">{{ alert.config.message }}</span>
        </div>
        @if (alert.config.dismissible) {
          <cngx-close-button
            label="Dismiss"
            class="cngx-alert-stack__dismiss"
            (click)="alerter.dismiss(alert.id)"
          />
        }
      </div>
    }
    @if (overflowCount() > 0) {
      <button
        type="button"
        class="cngx-alert-stack__overflow"
        [attr.aria-expanded]="false"
        [attr.aria-controls]="overflowIds()"
        (click)="handleExpandOverflow()"
      >
        + {{ overflowCount() }} more
      </button>
    }
  `,
  styleUrls: ['./alert-stack.css'],
})
export class CngxAlertStack {
  /** The scoped alerter instance — use to add/dismiss alerts programmatically. */
  readonly alerter = inject(CngxAlerter);
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });

  /** Scope filter — only shows alerts matching this scope. */
  readonly scope = input<string | undefined>(undefined);

  /** Maximum visible alerts before collapse overflow. */
  readonly maxVisible = input<number>(5);

  /** Where new alerts appear. */
  readonly position = input<'top' | 'bottom'>('top');

  /** Reserve min-height for one alert to prevent layout shift. */
  readonly reserveSpace = input<boolean>(false);

  /** Auto-scroll stack into view when new alert appears. */
  readonly autoScroll = input<boolean>(true);

  /** @internal — expanded state. Resets when alert count drops to maxVisible or below. */
  private readonly expanded = linkedSignal({
    source: () => this.scopedAlerts().length <= this.maxVisible(),
    computation: (fitsInMax, previous) => (fitsInMax ? false : (previous?.value ?? false)),
  });

  /** @internal — alerts filtered by scope. */
  private readonly scopedAlerts = computed(() => {
    const s = this.scope();
    const all = this.alerter.alerts();
    return s !== undefined ? all.filter((a) => a.config.scope === s) : all;
  });

  /** @internal — alerts visible within maxVisible limit. */
  protected readonly visibleAlerts = computed(() => {
    const all = this.scopedAlerts();
    if (this.expanded()) {
      return all;
    }
    const max = this.maxVisible();
    return all.length > max ? all.slice(0, max) : all;
  });

  /** @internal — number of hidden overflow alerts. */
  protected readonly overflowCount = computed(() => {
    if (this.expanded()) {
      return 0;
    }
    return Math.max(0, this.scopedAlerts().length - this.maxVisible());
  });

  /** @internal — IDs of overflow alerts for aria-controls. */
  protected readonly overflowIds = computed(() =>
    this.scopedAlerts()
      .slice(this.maxVisible())
      .map((a) => `cngx-alert-${a.id}`)
      .join(' '),
  );

  /** @internal — resolve icon component from global config. */
  protected iconFor(alert: AlertState) {
    return this.config?.alertIcons?.[alert.config.severity] ?? null;
  }

  /** @internal */
  protected handleExpandOverflow(): void {
    this.expanded.set(true);
  }
}
