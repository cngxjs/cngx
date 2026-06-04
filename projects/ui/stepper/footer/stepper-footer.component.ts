import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import {
  CNGX_STEPPER_HOST,
  createStepperHostProxy,
  type CngxStepperHost,
} from '@cngx/common/stepper';

/**
 * Navigation action-bar molecule for the stepper family. Lays out three
 * regions - start (Back), center (progress hint), end (Continue / Finish)
 * - and wires the {@link CNGX_STEPPER_HOST} for any nav atoms a consumer
 * drops inside.
 *
 * Resolves its host like `CngxStepperCount`: an explicit `[host]` input
 * for placement outside the stepper tree, falling back to the ambient
 * host injected from an ancestor `<cngx-stepper>` / `<cngx-mat-stepper>`
 * (`skipSelf`, so the footer reads the real presenter rather than its own
 * re-provided proxy). It then re-provides `CNGX_STEPPER_HOST` as a live
 * {@link createStepperHostProxy} over the resolved host, so child
 * `[cngxStepperPrevious]` / `[cngxStepperNext]` atoms resolve it
 * ambiently whether the footer is nested or used standalone with
 * `[host]`. `providers` (not `viewProviders`) carries the proxy to the
 * consumer-projected button content. With no host at all, the proxy's
 * neutral set renders the nav buttons disabled.
 *
 * ```html
 * <cngx-stepper #s="cngxStepper"> … </cngx-stepper>
 * <cngx-stepper-footer [host]="s.presenter">
 *   <button cngxStepperFooterStart cngxStepperPrevious>Back</button>
 *   <cngx-stepper-count cngxStepperFooterCenter />
 *   <button cngxStepperFooterEnd cngxStepperNext>Continue</button>
 * </cngx-stepper-footer>
 * ```
 *
 * @category ui/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/stepper/footer/stepper-footer.component.ts
 * @since 0.1.0
 * @relatedTo CngxStepper, CngxStepperPrevious, CngxStepperNext, CngxStepperComplete, CngxStepperCount
 */
@Component({
  selector: 'cngx-stepper-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxStepperFooter',
  host: { class: 'cngx-stepper-footer' },
  providers: [
    {
      provide: CNGX_STEPPER_HOST,
      useFactory: (footer: CngxStepperFooter) =>
        createStepperHostProxy(() => footer.resolvedHost()),
      deps: [CngxStepperFooter],
    },
  ],
  template: `
    <div class="cngx-stepper-footer__start">
      <ng-content select="[cngxStepperFooterStart]" />
    </div>
    <div class="cngx-stepper-footer__center">
      <ng-content select="[cngxStepperFooterCenter]" />
    </div>
    <div class="cngx-stepper-footer__end">
      <ng-content select="[cngxStepperFooterEnd]" />
    </div>
  `,
  styleUrl: './stepper-footer.css',
})
export class CngxStepperFooter {
  /**
   * Explicit stepper-host reference for placement *outside* the stepper
   * tree (`[host]="s.presenter"`). When unset, the ambient
   * {@link CNGX_STEPPER_HOST} from an ancestor stepper is used.
   */
  readonly host = input<CngxStepperHost | null>(null);

  // `skipSelf` so this never resolves the proxy this component itself
  // provides - it reads the ancestor stepper's presenter.
  private readonly injectedHost = inject(CNGX_STEPPER_HOST, { optional: true, skipSelf: true });

  /** Resolved host: explicit input wins, else the ambient ancestor host. */
  readonly resolvedHost = computed<CngxStepperHost | null>(
    () => this.host() ?? this.injectedHost,
  );
}
