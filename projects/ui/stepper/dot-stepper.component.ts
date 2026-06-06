import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import {
  CngxDotStepperDot,
  type CngxDotStepperDotContext,
  CngxStepperPresenter,
  CngxStepperSwipeNav,
  CNGX_STEPPER_GLYPHS,
  CNGX_STEPPER_HOST,
  createStepperStateView,
  injectStepperConfig,
  injectStepperI18n,
  resolveStepperErrorSummary,
  type CngxStepNode,
} from '@cngx/common/stepper';
import { CngxSwipe } from '@cngx/common/interactive';

/**
 * Dot stepper variant. Mobile-first sequential-flow indicator. Renders
 * one labelled `<span role="img">` per step (a name-permitting role, so
 * each dot announces "Step N of M: label") inside a
 * `<div role="group" aria-roledescription="Step indicator">`. The active
 * dot carries `aria-current="step"` per the W3C APG step-indicator
 * pattern (NOT `role="tablist"` / `role="tab"` - those are reserved
 * for parallel content panels, not sequential flow).
 *
 * Tap-to-select is intentionally NOT wired on individual dots: under
 * the APG pattern each dot is a label, not a button, and attaching
 * `(click)` to `role="img"` conflates two ARIA contracts. Navigation
 * is offered uniformly via three modalities owned by the host element:
 * arrow / Home / End keys, the composed `CngxStepperSwipeNav` dot-row
 * gesture, and the two-way `[(activeStepIndex)]` binding for
 * external buttons. Consumers wanting per-dot tap-to-jump compose the
 * parent `<cngx-stepper>` (whose mobile-collapse `dots` branch
 * renders each dot as a `<button>`).
 *
 * Theming flows through new `--cngx-dot-step-*` custom properties whose
 * defaults cascade through `var(--cngx-step-active-fill, ...)`, so the
 * Phase A active-fill chain reaches the dot variant without duplication.
 *
 * @category ui/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/stepper/dot-stepper.component.ts
 * @since 0.1.0
 * @relatedTo CngxStepperPresenter, CngxProgressBarStepper, CngxTextStepper
 * <example-url>http://localhost:4200/#/ui/stepper/dot-stepper/mobile-carousel</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/dot-stepper/icon-dots-via-code-cngxdotstepperdot-code</example-url>
 */
@Component({
  selector: 'cngx-dot-stepper',
  exportAs: 'cngxDotStepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, CngxSwipe],
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: ['activeStepIndex', 'linear'],
      outputs: ['activeStepIndexChange'],
    },
    {
      directive: CngxStepperSwipeNav,
      inputs: ['mobileSwipe'],
    },
  ],
  templateUrl: './dot-stepper.component.html',
  styleUrl: './dot-stepper.component.css',
  host: {
    class: 'cngx-dot-stepper',
    role: 'group',
    tabindex: '0',
    '[attr.aria-roledescription]': 'i18n.stepIndicatorRoleDescription',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[attr.aria-invalid]': 'stateView.hasAnyError() ? "true" : null',
    '(keydown)': 'handleKeyDown($event)',
  },
})
export class CngxDotStepper {
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  protected readonly presenter = inject(CNGX_STEPPER_HOST);
  protected readonly i18n = injectStepperI18n();
  protected readonly config = injectStepperConfig();
  /** Mobile-swipe routing surface composed via hostDirectives. */
  protected readonly swipeNav = inject(CngxStepperSwipeNav, { host: true });

  protected readonly stepNodes: Signal<readonly CngxStepNode[]> = this.presenter.stepsOnly;
  protected readonly activeIndex = computed<number>(() => this.presenter.activeStepIndex());

  /** Shared per-step/aggregate state derivations - the single error source. */
  protected readonly stateView = createStepperStateView({
    presenter: this.presenter,
    stepsOnly: this.stepNodes,
  });

  /** Default error glyph for the aggregate error line. */
  protected readonly errorGlyph = CNGX_STEPPER_GLYPHS.errorBadge;

  /**
   * Aggregate error line. The dot row only colours the errored dot, so
   * the real reason (the `[error]` string / aggregator label) needs a
   * text surface; this is it. Falls back to the count phrase for
   * multiple errors.
   */
  protected readonly errorText = computed<string>(() =>
    resolveStepperErrorSummary(
      this.stateView,
      this.stepNodes,
      this.i18n,
      (node) => node.errorMessage?.() ?? node.errorAggregator?.()?.errorLabels?.()?.[0],
    ),
  );

  private readonly dotSlot = contentChild(CngxDotStepperDot);

  /**
   * Resolved dot-body template cascade: per-instance `*cngxDotStepperDot`
   * directive > `CNGX_STEPPER_CONFIG.templates.dotStepperDot` > `null`
   * (built-in empty body). Pillar 1 - resolution is a `computed`, not
   * manual sync.
   */
  protected readonly resolvedDotTemplate = computed<TemplateRef<CngxDotStepperDotContext> | null>(
    () => this.dotSlot()?.templateRef ?? this.config.templates?.dotStepperDot ?? null,
  );

  protected isActive(node: CngxStepNode, index: number): boolean {
    return index === this.activeIndex() && node.kind === 'step';
  }

  protected isCompleted(index: number): boolean {
    return index < this.activeIndex();
  }

  /**
   * Resolved `data-state` for the dot: `'error'` whenever the unified error
   * view fires (covers commit rejection and the error aggregator, not just a
   * literal `state === 'error'`), otherwise the raw step status.
   */
  protected dotState(node: CngxStepNode): string {
    return this.stateView.hasError(node) ? 'error' : node.state();
  }

  protected ariaLabelFor(node: CngxStepNode, index: number): string {
    const base = this.i18n.selectedStep(node.label(), index + 1, this.stepNodes().length);
    return this.stateView.hasError(node) ? `${base}: ${this.i18n.statusLabels.errored}` : base;
  }

  /** Build the slot context for `*cngxDotStepperDot`. */
  protected dotContextFor(node: CngxStepNode, index: number): CngxDotStepperDotContext {
    return {
      $implicit: index,
      index,
      node,
      active: this.isActive(node, index),
      completed: this.isCompleted(index),
    };
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    // Linear mode is enforced by the presenter, not by silencing the
    // keyboard. `selectNext` routes through `presenter.select()` which
    // refuses jumps over incomplete steps; `selectPrevious` is the
    // ungated direct back-move. `Home` is always a back-move; `End`
    // routes through `select()` and is gated when intermediate steps
    // are incomplete. Disabling the whole handler in linear mode
    // killed back-nav too, which is the inverse of the W3C APG
    // step-indicator pattern (read-back should always be reachable).
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.presenter.selectNext();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.presenter.selectPrevious();
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.presenter.select(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.presenter.select(this.stepNodes().length - 1);
    }
  }
}
