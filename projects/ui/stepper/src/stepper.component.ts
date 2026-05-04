import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import {
  CngxFocusRestore,
  CngxRovingItem,
  CngxRovingTabindex,
} from '@cngx/common/a11y';
import {
  CNGX_STEP_PANEL_HOST,
  CngxStep,
  CngxStepperPresenter,
  CNGX_STEPPER_HOST,
  injectStepperConfig,
  injectStepperI18n,
  type CngxStepNode,
  type CngxStepPanelHost,
} from '@cngx/common/stepper';

/**
 * CNGX-standard stepper organism. Thin shell composing the
 * `CngxStepperPresenter` brain with `CngxRovingTabindex`,
 * `CngxFocusRestore`, and `CngxLiveRegion` via `hostDirectives`.
 * Material consumers reach for `<cngx-mat-stepper>` (sibling
 * `@cngx/ui/mat-stepper` entry) instead.
 *
 * The presenter owns `activeStepIndex`, `linear`, `orientation`,
 * `commitAction`, `commitMode`; the organism forwards them through
 * `hostDirectives.inputs`. Renders the strip + panels via two
 * `@for` loops over `presenter.flatSteps()`. Reactive ARIA — every
 * `aria-current`, `aria-controls`, `aria-describedby`, `aria-busy`
 * is `computed()`, never a one-time binding.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-stepper',
  exportAs: 'cngxStepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CngxRovingItem],
  styleUrls: ['./styles/stepper-base.css', './stepper.component.css'],
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: ['activeStepIndex', 'linear', 'orientation', 'commitAction', 'commitMode'],
      outputs: ['activeStepIndexChange'],
    },
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation'],
    },
    { directive: CngxFocusRestore },
    // CngxLiveRegion is NOT composed here — its host binding sets
    // role="status", which would clobber the stepper's role="group"
    // landmark. The Phase 3 commit-lifecycle wiring will mount a
    // dedicated `<span cngxLiveRegion>` inside the template for SR
    // announcements (selected-step changes, commit success/failure).
  ],
  providers: [{ provide: CNGX_STEP_PANEL_HOST, useExisting: CngxStepper }],
  templateUrl: './stepper.component.html',
  host: {
    'role': 'group',
    '[attr.aria-roledescription]': 'stepperRoleDescription()',
    '[attr.aria-orientation]': 'presenter.orientation()',
    '[attr.data-orientation]': 'presenter.orientation()',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[class.cngx-stepper]': 'true',
  },
})
export class CngxStepper implements CngxStepPanelHost {
  readonly panelClass = input<string | readonly string[] | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  protected readonly presenter = inject(CNGX_STEPPER_HOST) as CngxStepperPresenter;
  protected readonly i18n = injectStepperI18n();
  protected readonly config = injectStepperConfig();
  private readonly stepDirectives = contentChildren(CngxStep, { descendants: true });

  /** Stepper landmark role-description with config + i18n cascade. */
  protected readonly stepperRoleDescription = computed<string>(
    () =>
      this.config.fallbackLabels?.stepRoleDescription ??
      this.i18n.stepperLabel,
  );

  /** Group landmark role-description with config + i18n cascade. */
  protected readonly groupRoleDescription = computed<string>(
    () =>
      this.config.fallbackLabels?.groupRoleDescription ?? 'step group',
  );

  /**
   * `aria-label` resolves Input → ariaLabels.stepperRegion config →
   * i18n.stepperLabel. Pillar 2 — the surface declared by config /
   * i18n must reach the DOM.
   */
  protected readonly resolvedAriaLabel = computed<string | null>(() => {
    if (this.ariaLabelledBy()) {
      return null; // labelledby trumps label
    }
    return (
      this.ariaLabel() ??
      this.config.ariaLabels?.stepperRegion ??
      this.i18n.stepperLabel
    );
  });

  // Pre-build a Map<id, CngxStep> so labelTemplateFor /
  // contentTemplateFor are O(1) per call instead of O(N) linear
  // scans on every panel render.
  private readonly stepDirectiveById = computed(() => {
    const map = new Map<string, CngxStep>();
    for (const dir of this.stepDirectives()) {
      map.set(dir.id(), dir);
    }
    return map;
  });

  readonly flatSteps: Signal<readonly CngxStepNode[]> = this.presenter.flatSteps;
  readonly activeStepIndex: Signal<number> = this.presenter.activeStepIndex;
  readonly activeStepId: Signal<string | null> = this.presenter.activeStepId;

  /** Step-only flat projection (excludes group nodes). */
  protected readonly stepsOnly = computed(
    () => this.flatSteps().filter((n) => n.kind === 'step'),
  );

  protected readonly panelClassList = computed<readonly string[]>(() => {
    const cls = this.panelClass();
    if (!cls) {
      return [];
    }
    return Array.isArray(cls) ? (cls as readonly string[]) : [String(cls)];
  });

  /**
   * Step's position in the flat step-only projection. Reads
   * `flatIndex` directly — set by `flattenStepTree` at O(1) in the
   * presenter. Group nodes carry `-1` here, so callers that resolve
   * a UI position must guard `node.kind === 'step'` first.
   */
  protected stepIndexOf(node: CngxStepNode): number {
    return node.flatIndex;
  }

  protected isActive(node: CngxStepNode): boolean {
    return node.kind === 'step' && node.id === this.activeStepId();
  }

  protected isStepBusy(node: CngxStepNode): boolean {
    return (
      node.kind === 'step' &&
      this.presenter.commitState.status() === 'pending' &&
      this.presenter.intendedStepIndex() === node.flatIndex
    );
  }

  protected stepHeaderId(node: CngxStepNode): string {
    return `${node.id}-header`;
  }

  protected stepPanelId(node: CngxStepNode): string {
    return `${node.id}-panel`;
  }

  protected stepDescriptorId(node: CngxStepNode): string {
    return `${node.id}-desc`;
  }

  /**
   * SR descriptor phrase for a step header. Reads the aggregator's
   * announcement when one is bound and the aggregator opted-in to
   * showing errors; otherwise falls back to a "Step N of M:
   * <label>" phrase from the i18n bundle.
   */
  protected statusPhrase(node: CngxStepNode): string {
    const aggregator = node.errorAggregator?.();
    if (aggregator?.shouldShow?.() && aggregator.announcement) {
      return aggregator.announcement();
    }
    if (node.kind !== 'step') {
      return '';
    }
    const idx = this.stepIndexOf(node);
    if (idx < 0) {
      return '';
    }
    return this.i18n.selectedStep(node.label(), idx + 1, this.stepsOnly().length);
  }

  /** Group descriptor — rolls up children's aggregated status. */
  protected groupStatusPhrase(node: CngxStepNode): string {
    const status = node.state();
    if (status === 'error') {
      return this.i18n.stepErrored;
    }
    if (status === 'success') {
      return this.i18n.stepCompleted;
    }
    return '';
  }

  /** Whether to render the error badge for a step node. */
  protected showErrorBadge(node: CngxStepNode): boolean {
    return !!node.errorAggregator?.()?.shouldShow?.();
  }

  protected handleHeaderClick(node: CngxStepNode): void {
    if (node.kind !== 'step' || node.disabled()) {
      return;
    }
    const idx = this.stepIndexOf(node);
    if (idx >= 0) {
      this.presenter.select(idx);
    }
  }

  // CngxStepPanelHost contract — O(1) via the pre-built map.
  labelTemplateFor(id: string): TemplateRef<unknown> | null {
    return this.stepDirectiveById().get(id)?.labelTemplate()?.templateRef ?? null;
  }

  contentTemplateFor(id: string): TemplateRef<unknown> | null {
    return this.stepDirectiveById().get(id)?.contentTemplate()?.templateRef ?? null;
  }
}
