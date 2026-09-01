import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
  viewChild,
  type TemplateRef,
} from '@angular/core';

import type { AlertSeverity } from '../alert/alert';
import { CngxToaster, type ToastRef } from './toast.service';

/**
 * Declarative toast - renders nothing at its position, pushes into the global `CngxToastOutlet`.
 *
 * Shows a toast when `[when]` becomes `true`. Dismisses when `[when]` becomes `false`
 * (unless already auto-dismissed). Supports projected content for custom toast bodies.
 *
 * Requires `provideToasts()` or `provideFeedback(withToasts())`.
 *
 * ### Simple message
 * ```html
 * <cngx-toast severity="success" message="Saved" [when]="saved()" />
 * ```
 *
 * ### With custom content
 * Projected content replaces `message` as the toast body. Keep it
 * non-interactive - the toast renders inside a live region, where focusable
 * elements are unreachable for screen reader users. For a button, use
 * `actionLabel`/`actionHandler` instead.
 * ```html
 * <cngx-toast severity="error" [when]="hasError()"
 *   actionLabel="Retry" [actionHandler]="retry">
 *   Something went <strong>wrong</strong>.
 * </cngx-toast>
 * ```
 *
 * ### With async state
 * ```html
 * <cngx-toast severity="success" message="Item saved" [when]="saveState.status() === 'success'" />
 * <cngx-toast severity="error" message="Save failed" [when]="saveState.status() === 'error'" />
 * ```
 *
 * @category ui/feedback/toast
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/toast/toast.component.ts
 * @since 0.1.0
 * @relatedTo CngxToaster, CngxToastOutlet, CngxToastOn
 *
 * <example-url>http://localhost:4200/#/ui/feedback/toast/custom-component-body</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/declarative-cngx-toast</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/programmatic-cngxtoaster</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/state-bridge-cngxtoaston</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/title-description</example-url>
 */
@Component({
  selector: 'cngx-toast',
  standalone: true,
  // Deferred projection: the ng-content only materializes where the captured
  // template is instantiated (probe or outlet), never at the host position.
  template: `<ng-template #projectedContent><ng-content /></ng-template>`,
  host: { style: 'display: none' },
})
export class CngxToast {
  private readonly toaster = inject(CngxToaster, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** When `true`, the toast is shown. When `false`, it is dismissed. */
  readonly when = input.required<boolean>();

  /** Toast message text. Ignored when content is projected. */
  readonly message = input<string>('');

  /** Visual severity. */
  readonly severity = input<AlertSeverity>('info');

  /** Auto-dismiss duration in ms, or `'persistent'`. */
  readonly duration = input<number | 'persistent' | undefined>(undefined);

  /** Show dismiss button. */
  readonly dismissible = input<boolean>(true);

  /** Action button config. */
  readonly actionLabel = input<string | undefined>(undefined);
  readonly actionHandler = input<(() => void) | undefined>(undefined);

  /** @internal */
  private readonly action = computed(() => {
    const label = this.actionLabel();
    const handler = this.actionHandler();
    return label && handler ? { label, handler } : undefined;
  });

  private readonly projectedContent =
    viewChild<TemplateRef<unknown>>('projectedContent');

  private activeRef: ToastRef | null = null;
  private hasProjectedContent: boolean | undefined;

  constructor() {
    if (!this.toaster) {
      throw new Error(
        '[cngx-toast] CngxToaster not found. ' +
          'Add withToasts() to provideFeedback() or call provideToasts() in your providers.',
      );
    }

    const toaster = this.toaster;

    // Edge-triggered: false→true shows, true→false dismisses (a no-op when
    // the toast already auto-dismissed). The toast owns its own timer.
    let previousWhen = false;

    effect(() => {
      const show = this.when();

      if (show === previousWhen) {
        return;
      }
      previousWhen = show;

      untracked(() => {
        if (show) {
          const contentTemplate = this.captureProjectedContent();
          this.activeRef = toaster.show({
            message: this.message(),
            severity: this.severity(),
            duration: this.duration(),
            dismissible: this.dismissible(),
            action: this.action(),
            contentTemplate,
          });

          this.activeRef.afterDismissed().subscribe(() => {
            this.activeRef = null;
          });
        } else {
          this.activeRef?.dismiss();
          this.activeRef = null;
        }
      });
    });

    this.destroyRef.onDestroy(() => {
      this.activeRef?.dismiss();
      this.activeRef = null;
    });
  }

  /**
   * Returns the content template when something was actually projected,
   * `undefined` otherwise (then `message` renders). Presence is probed once
   * via a throwaway embedded view - deferred projection re-attaches the
   * nodes wherever the template instantiates next.
   */
  private captureProjectedContent(): TemplateRef<unknown> | undefined {
    const tpl = this.projectedContent();
    if (!tpl) {
      return undefined;
    }
    if (this.hasProjectedContent === undefined) {
      const view = tpl.createEmbeddedView(undefined);
      view.detectChanges();
      this.hasProjectedContent = view.rootNodes.some(
        (node: Node) =>
          node.nodeType === Node.ELEMENT_NODE ||
          (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0),
      );
      view.destroy();
    }
    return this.hasProjectedContent ? tpl : undefined;
  }
}
