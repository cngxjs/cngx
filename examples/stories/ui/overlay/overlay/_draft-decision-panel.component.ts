import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CngxFocusTrap } from '@cngx/common/a11y';
import { CngxOverlayRef } from '@cngx/ui/overlay';

/** Result the panel hands back through `CngxOverlayRef.close(result)`. */
export type DraftDecision = 'keep' | 'discard';

/**
 * Demo fixture opened by the `@cngx/ui/overlay` stories through
 * `CngxOverlay.open(DraftDecisionPanel)`. It injects the `CngxOverlayRef`
 * the service provides to the portal and closes it with a typed result.
 * The focus trap keeps Tab inside the panel and focuses its first button.
 *
 * Internal demo fixture only - not part of any published bundle.
 */
@Component({
  selector: 'demo-draft-decision-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxFocusTrap],
  template: `
    <div
      class="cngx-ex-overlay-panel"
      cngxFocusTrap
      [enabled]="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-draft-decision-title"
      aria-describedby="demo-draft-decision-body"
    >
      <h2 id="demo-draft-decision-title">Discard this draft?</h2>
      <p id="demo-draft-decision-body">The panel closes with the button you pick as its result.</p>
      <div class="demo-inline-actions">
        <button type="button" class="chip" (click)="ref.close('keep')">Keep editing</button>
        <button type="button" class="chip chip--active" (click)="ref.close('discard')">
          Discard
        </button>
      </div>
    </div>
  `,
})
export class DraftDecisionPanel {
  protected readonly ref = inject<CngxOverlayRef<DraftDecision>>(CngxOverlayRef);
}
