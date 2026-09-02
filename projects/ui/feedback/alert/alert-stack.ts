import { NgComponentOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';

import { CngxCloseButton } from '@cngx/common/interactive';

import { CNGX_FEEDBACK_CONFIG } from '../config/feedback-config';
import { CngxSeverityIcon } from '../config/severity-icon';
import { CngxAlerter, type AlertState } from './alerter.service';

/** @internal - one rendered alert plus the service instance that owns it. */
interface StackEntry {
  /** Render-stable key - service-local ids collide across instances. */
  readonly key: string;
  readonly state: AlertState;
  readonly owner: CngxAlerter;
}

/** @internal - AlertState objects are immutable, so reference equality per slot suffices. */
function entriesEqual(a: readonly StackEntry[], b: readonly StackEntry[]): boolean {
  return a.length === b.length && a.every((e, i) => e.state === b[i].state && e.key === b[i].key);
}

/**
 * Scoped alert stack - renders alerts from its own `CngxAlerter` instance
 * merged with the nearest ancestor/environment instance.
 *
 * Provides `CngxAlerter` via `viewProviders` - the stack's own instance is
 * private to its view. Alerts shown through an ancestor-provided alerter or
 * the environment alerter from `provideFeedback(withAlerts())` (the instance
 * `CngxAlertOn` and sibling components resolve) render here too, filtered by
 * `[scope]`. Nesting is supported - each stack stays independent.
 *
 * Scope your stacks when more than one is mounted: two unscoped stacks
 * under the same environment alerter both render (and announce) every
 * shared alert.
 *
 * ### In a dialog
 * The dialog component and the stack resolve the same environment alerter,
 * so programmatic alerts land in the stack below:
 * ```html
 * <dialog cngxDialog [submitAction]="save">
 *   <header cngxDialogTitle>Edit user</header>
 *   <cngx-alert-stack scope="user-form" position="top" />
 *   <form>...</form>
 * </dialog>
 * ```
 *
 * ### Programmatic usage
 * Requires `provideFeedback(withAlerts())` (or an ancestor component that
 * provides `CngxAlerter`):
 * ```typescript
 * private readonly alerter = inject(CngxAlerter);
 *
 * handleErrors(errors: string[]) {
 *   this.alerter.dismissAll('user-form');
 *   errors.forEach(e =>
 *     this.alerter.show({ message: e, severity: 'error', scope: 'user-form' }),
 *   );
 * }
 * ```
 *
 * @category ui/feedback/alert
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/alert/alert-stack.ts
 * @since 0.1.0
 * @relatedTo CngxAlerter, CngxAlert, CngxAlertOn
 *
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
  // Plain region host, not a live region: the items carry role="alert" /
  // role="status" themselves - wrapping them in a polite log double-announces
  // and downgrades assertive errors.
  host: {
    class: 'cngx-alert-stack',
    role: 'region',
    'aria-label': 'Alerts',
    '[class.cngx-alert-stack--reserve-space]': 'reserveSpace()',
  },
  template: `
    @for (entry of visibleEntries(); track entry.key) {
      <div
        class="cngx-alert-stack__item"
        tabindex="-1"
        [class.cngx-alert-stack__item--info]="entry.state.config.severity === 'info'"
        [class.cngx-alert-stack__item--success]="entry.state.config.severity === 'success'"
        [class.cngx-alert-stack__item--warning]="entry.state.config.severity === 'warning'"
        [class.cngx-alert-stack__item--error]="entry.state.config.severity === 'error'"
        [attr.role]="
          entry.state.config.severity === 'error' || entry.state.config.severity === 'warning'
            ? 'alert'
            : 'status'
        "
        (pointerenter)="entry.owner.pauseTimer(entry.state.id)"
        (pointerleave)="entry.owner.resumeTimer(entry.state.id)"
        (focusin)="entry.owner.pauseTimer(entry.state.id)"
        (focusout)="entry.owner.resumeTimer(entry.state.id)"
      >
        <div class="cngx-alert-stack__icon">
          @if (iconFor(entry.state); as iconCmp) {
            <ng-container *ngComponentOutlet="iconCmp" />
          } @else {
            <cngx-severity-icon
              [severity]="entry.state.config.severity"
              iconClass="cngx-alert-stack__default-icon"
            />
          }
        </div>
        <div class="cngx-alert-stack__body">
          @if (entry.state.config.title) {
            <strong class="cngx-alert-stack__title">{{ entry.state.config.title }}</strong>
          }
          <span class="cngx-alert-stack__message">{{ entry.state.config.message }}</span>
        </div>
        @if (entry.state.config.dismissible) {
          <cngx-close-button
            label="Dismiss"
            class="cngx-alert-stack__dismiss"
            (click)="entry.owner.dismiss(entry.state.id)"
          />
        }
      </div>
    }
    @if (overflowCount() > 0) {
      <button
        type="button"
        class="cngx-alert-stack__overflow"
        [attr.aria-label]="'Show ' + overflowCount() + ' more alerts'"
        (click)="handleExpandOverflow()"
      >
        + {{ overflowCount() }} more
      </button>
    }
  `,
  styleUrls: ['./alert-stack.css'],
})
export class CngxAlertStack {
  /** The scoped alerter instance - use to add/dismiss alerts programmatically. */
  readonly alerter = inject(CngxAlerter);

  /**
   * Nearest ancestor/environment alerter - the instance `CngxAlertOn` and
   * sibling components resolve. Merged into the rendered stack so the
   * documented `withAlerts()` routing actually lands somewhere.
   */
  private readonly parentAlerter = inject(CngxAlerter, { skipSelf: true, optional: true });

  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Scope filter - only shows alerts matching this scope. */
  readonly scope = input<string | undefined>(undefined);

  /** Maximum visible alerts before collapse overflow. Defaults to `withAlerts({ maxVisible })`, then 5. */
  readonly maxVisible = input<number | undefined>(undefined);

  /** Where new alerts appear. */
  readonly position = input<'top' | 'bottom'>('top');

  /** Reserve min-height for one alert to prevent layout shift. */
  readonly reserveSpace = input<boolean>(false);

  /** Auto-scroll stack into view when new alert appears. */
  readonly autoScroll = input<boolean>(true);

  /** @internal - maxVisible input, then withAlerts({ maxVisible }), then 5. */
  private readonly effectiveMaxVisible = computed(
    () => this.maxVisible() ?? this.config?.alertMaxVisible ?? 5,
  );

  /** @internal - expanded state. Resets when alert count drops to maxVisible or below. */
  private readonly expanded = linkedSignal({
    source: () => this.entries().length <= this.effectiveMaxVisible(),
    computation: (fitsInMax, previous) => (fitsInMax ? false : (previous?.value ?? false)),
  });

  /** @internal - own + ancestor alerts, scope-filtered, newest first. */
  private readonly entries = computed<readonly StackEntry[]>(
    () => {
      const s = this.scope();
      const matches = (a: AlertState): boolean => s === undefined || a.config.scope === s;

      const own: StackEntry[] = this.alerter
        .alerts()
        .filter(matches)
        .map((state) => ({ key: `own-${state.id}`, state, owner: this.alerter }));
      const parent: StackEntry[] = this.parentAlerter
        ? this.parentAlerter
            .alerts()
            .filter(matches)
            .map((state) => ({ key: `env-${state.id}`, state, owner: this.parentAlerter! }))
        : [];

      return [...own, ...parent].sort((a, b) => b.state.createdAt - a.state.createdAt);
    },
    { equal: entriesEqual },
  );

  /** @internal - entries within maxVisible, ordered per [position]. */
  protected readonly visibleEntries = computed(
    () => {
      const all = this.entries();
      const max = this.effectiveMaxVisible();
      const sliced = this.expanded() || all.length <= max ? all : all.slice(0, max);
      return this.position() === 'bottom' ? [...sliced].reverse() : sliced;
    },
    { equal: entriesEqual },
  );

  /** @internal - number of hidden overflow alerts. */
  protected readonly overflowCount = computed(() => {
    if (this.expanded()) {
      return 0;
    }
    return Math.max(0, this.entries().length - this.effectiveMaxVisible());
  });

  /**
   * @internal - arrival detection derived via linkedSignal (not managed in
   * the effect). `arrived` is true only when a key shows up that was not
   * rendered before - a dismissal exposing an older neighbour is not an
   * arrival. The initial computation (mount with pre-existing alerts) never
   * counts as one.
   */
  private readonly arrivalTransition = linkedSignal<
    readonly string[],
    { keys: readonly string[]; arrived: boolean }
  >({
    source: () => this.entries().map((e) => e.key),
    computation: (keys, prev) => ({
      keys,
      arrived: prev !== undefined && keys.some((k) => !prev.value.keys.includes(k)),
    }),
    equal: (a, b) =>
      a.arrived === b.arrived &&
      a.keys.length === b.keys.length &&
      a.keys.every((k, i) => k === b.keys[i]),
  });

  constructor() {
    effect(() => {
      const { arrived } = this.arrivalTransition();
      if (arrived && untracked(this.autoScroll)) {
        this.host.nativeElement.scrollIntoView?.({ block: 'nearest' });
      }
    });
  }

  /** @internal - resolve icon component from global config. */
  protected iconFor(alert: AlertState) {
    return this.config?.alertIcons?.[alert.config.severity] ?? null;
  }

  /**
   * @internal - the overflow button removes itself on expansion, so focus is
   * handed to the first newly revealed alert item instead of falling to body.
   */
  protected handleExpandOverflow(): void {
    const revealIndex = this.position() === 'bottom' ? 0 : this.visibleEntries().length;
    this.expanded.set(true);
    afterNextRender(
      () => {
        const items =
          this.host.nativeElement.querySelectorAll<HTMLElement>('.cngx-alert-stack__item');
        items[revealIndex]?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }
}
