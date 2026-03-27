import { NgTemplateOutlet } from '@angular/common';
import { CngxCloseButton } from '@cngx/common/interactive';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import { CNGX_POPOVER_PANEL_CONFIG } from './popover-panel.config';
import {
  CngxPopoverClose,
  CngxPopoverEmpty,
  CngxPopoverError,
  CngxPopoverLoading,
} from './popover-panel-slots';
import { CngxPopover } from './popover.directive';

/**
 * Rich popover panel molecule with header/body/footer slots, variant
 * styling, arrow, close button, and content state templates.
 *
 * Composes `CngxPopover` via `hostDirectives` — all popover inputs
 * (`placement`, `offset`, `closeOnEscape`, `mode`, `exclusive`,
 * `cngxPopoverOpen`) are forwarded.
 *
 * The `variant` input is a free-form string mapped to a CSS class
 * (`cngx-popover-panel--{variant}`). Five variants are pre-themed
 * in `popover-panel-theme.scss`: `default`, `info`, `warning`,
 * `danger`, `success`. Add custom variants via CSS.
 *
 * @usageNotes
 *
 * ### Basic with header/body/footer
 * ```html
 * <button [cngxPopoverTrigger]="panel" (click)="panel.popover.toggle()">Menu</button>
 * <cngx-popover-panel #panel variant="danger" [showClose]="true" [showArrow]="true">
 *   <span cngxPopoverHeader>Delete Item?</span>
 *   <p cngxPopoverBody>This action cannot be undone.</p>
 *   <div cngxPopoverFooter>
 *     <cngx-popover-action role="dismiss">Cancel</cngx-popover-action>
 *     <cngx-popover-action role="confirm" [action]="delete" variant="danger">
 *       Delete
 *     </cngx-popover-action>
 *   </div>
 * </cngx-popover-panel>
 * ```
 *
 * ### With loading state
 * ```html
 * <cngx-popover-panel [loading]="isLoading()" [error]="loadError()">
 *   <p cngxPopoverBody>Loaded content here</p>
 *   <ng-template cngxPopoverLoading>Loading...</ng-template>
 *   <ng-template cngxPopoverError let-err>Failed: {{ err }}</ng-template>
 * </cngx-popover-panel>
 * ```
 */
@Component({
  selector: 'cngx-popover-panel',
  standalone: true,
  imports: [NgTemplateOutlet, CngxCloseButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxPopoverPanel',
  hostDirectives: [
    {
      directive: CngxPopover,
      inputs: ['placement', 'offset', 'closeOnEscape', 'mode', 'exclusive', 'cngxPopoverOpen'],
    },
  ],
  host: {
    '[class]': 'hostClass()',
    '[attr.aria-labelledby]': 'headerId',
    '[attr.aria-describedby]': 'ariaDescribedBy()',
    '[attr.aria-busy]': 'loading() || null',
  },
  template: `
    @if (showArrow()) {
      <div class="cngx-popover-panel__arrow"></div>
    }

    @if (showClose()) {
      @if (closeTpl(); as tpl) {
        <ng-container *ngTemplateOutlet="tpl.templateRef" />
      } @else {
        <cngx-close-button label="Close" class="cngx-popover-panel__close" (click)="popover.hide()" />
      }
    }

    @if (loading()) {
      @if (loadingTpl(); as tpl) {
        <div class="cngx-popover-panel__loading">
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        </div>
      }
    } @else if (error()) {
      @if (errorTpl(); as tpl) {
        <div class="cngx-popover-panel__error">
          <ng-container *ngTemplateOutlet="tpl.templateRef; context: { $implicit: error() }" />
        </div>
      }
    } @else if (empty()) {
      @if (emptyTpl(); as tpl) {
        <div class="cngx-popover-panel__empty">
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        </div>
      }
    } @else {
      @if (hasHeader()) {
        <div class="cngx-popover-panel__header" [id]="headerId">
          <ng-content select="[cngxPopoverHeader]" />
        </div>
      }
      <div class="cngx-popover-panel__body" [id]="bodyId">
        <ng-content select="[cngxPopoverBody]" />
        <ng-content />
      </div>
      @if (hasFooter()) {
        <div class="cngx-popover-panel__footer">
          <ng-content select="[cngxPopoverFooter]" />
        </div>
      }
    }
  `,
})
export class CngxPopoverPanel {
  /** The underlying popover state machine. */
  readonly popover = inject(CngxPopover, { self: true });
  private readonly config = inject(CNGX_POPOVER_PANEL_CONFIG);
  private readonly destroyRef = inject(DestroyRef);

  // ── Inputs ────────────────────────────────────────────────────────

  /**
   * Variant string — mapped to CSS class `cngx-popover-panel--{variant}`.
   * Pre-themed: `default`, `info`, `warning`, `danger`, `success`.
   * Add custom variants via CSS.
   */
  readonly variant = input<string | undefined>(undefined);

  /** Show a close button. Falls back to global config from `providePopoverPanel(withCloseButton())`. */
  readonly showCloseInput = input<boolean | undefined>(undefined, { alias: 'showClose' });

  /** Show an arrow. Falls back to global config from `providePopoverPanel(withArrow())`. */
  readonly showArrowInput = input<boolean | undefined>(undefined, { alias: 'showArrow' });

  /** Resolved showClose — input takes precedence over config. */
  readonly showClose = computed(() => this.showCloseInput() ?? this.config.showClose ?? false);

  /** Resolved showArrow — input takes precedence over config. */
  readonly showArrow = computed(() => this.showArrowInput() ?? this.config.showArrow ?? false);

  /** Whether the panel content is in a loading state. */
  readonly loading = input(false);

  /** Error value when content loading failed. Truthy = show error template. */
  readonly error = input<unknown>(undefined);

  /** Whether the panel content is empty. */
  readonly empty = input(false);

  /** Whether the header slot has projected content. */
  readonly hasHeader = input(true);

  /** Whether the footer slot has projected content. */
  readonly hasFooter = input(false);

  // ── Content state templates ───────────────────────────────────────

  protected readonly closeTpl = contentChild(CngxPopoverClose);
  protected readonly loadingTpl = contentChild(CngxPopoverLoading);
  protected readonly emptyTpl = contentChild(CngxPopoverEmpty);
  protected readonly errorTpl = contentChild(CngxPopoverError);

  // ── IDs ───────────────────────────────────────────────────────────

  private readonly uid = nextUid('cngx-pp');
  protected readonly headerId = `${this.uid}-header`;
  protected readonly bodyId = `${this.uid}-body`;

  /** Only point to body when default content is showing (not loading/error/empty). */
  protected readonly ariaDescribedBy = computed(() =>
    this.loading() || this.error() || this.empty() ? null : this.bodyId,
  );

  // ── Computed ──────────────────────────────────────────────────────

  protected readonly hostClass = computed(() => {
    const v = this.variant() ?? this.config.defaultVariant ?? 'default';
    let cls = `cngx-popover-panel cngx-popover-panel--${v}`;
    if (this.showArrow()) {
      cls += ' cngx-popover-panel--arrow';
    }
    return cls;
  });

  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Auto-dismiss based on variant config
    effect(() => {
      const isVisible = this.popover.isVisible();
      const v = this.variant() ?? untracked(() => this.config.defaultVariant) ?? 'default';
      const timing = untracked(() => this.config.autoDismiss);

      // Always clear previous timer before setting a new one
      if (this.autoDismissTimer) {
        clearTimeout(this.autoDismissTimer);
        this.autoDismissTimer = null;
      }
      if (isVisible && timing?.[v]) {
        this.autoDismissTimer = setTimeout(() => this.popover.hide(), timing[v]);
      } else if (!isVisible && this.autoDismissTimer) {
        clearTimeout(this.autoDismissTimer);
        this.autoDismissTimer = null;
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.autoDismissTimer) {
        clearTimeout(this.autoDismissTimer);
      }
    });
  }
}
