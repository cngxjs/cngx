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
    'aria-roledescription': 'stepper',
    '[attr.aria-orientation]': 'presenter.orientation()',
    '[attr.data-orientation]': 'presenter.orientation()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[class.cngx-stepper]': 'true',
  },
})
export class CngxStepper implements CngxStepPanelHost {
  readonly panelClass = input<string | readonly string[] | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  protected readonly presenter = inject(CNGX_STEPPER_HOST) as CngxStepperPresenter;
  private readonly stepDirectives = contentChildren(CngxStep, { descendants: true });

  readonly flatSteps: Signal<readonly CngxStepNode[]> = this.presenter.flatSteps;
  readonly activeStepIndex: Signal<number> = this.presenter.activeStepIndex;
  readonly activeStepId: Signal<string | null> = this.presenter.activeStepId;

  /** Step-only flat projection (excludes group nodes). */
  protected readonly stepsOnly = computed(
    () => this.flatSteps().filter((n) => n.kind === 'step'),
  );

  protected readonly panelClassList = computed<readonly string[]>(() => {
    const cls = this.panelClass();
    if (!cls) return [];
    return Array.isArray(cls) ? (cls as readonly string[]) : [String(cls)];
  });

  /** Step ↔ index map for `aria-controls` ID generation. */
  protected stepIndexOf(node: CngxStepNode): number {
    return this.stepsOnly().findIndex((n) => n.id === node.id);
  }

  protected isActive(node: CngxStepNode): boolean {
    return node.kind === 'step' && node.id === this.activeStepId();
  }

  protected isStepBusy(node: CngxStepNode): boolean {
    return (
      node.kind === 'step' &&
      this.presenter.commitState.status() === 'pending' &&
      this.presenter.commitState.data() === this.stepIndexOf(node)
    );
  }

  protected stepHeaderId(node: CngxStepNode): string {
    return `${node.id}-header`;
  }

  protected stepPanelId(node: CngxStepNode): string {
    return `${node.id}-panel`;
  }

  protected handleHeaderClick(node: CngxStepNode): void {
    if (node.kind !== 'step' || node.disabled()) return;
    const idx = this.stepIndexOf(node);
    if (idx >= 0) this.presenter.select(idx);
  }

  // CngxStepPanelHost contract
  labelTemplateFor(id: string): TemplateRef<unknown> | null {
    const dir = this.stepDirectives().find((d) => d.id() === id);
    return dir?.labelTemplate()?.templateRef ?? null;
  }

  contentTemplateFor(id: string): TemplateRef<unknown> | null {
    const dir = this.stepDirectives().find((d) => d.id() === id);
    return dir?.contentTemplate()?.templateRef ?? null;
  }
}
