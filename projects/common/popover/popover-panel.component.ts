import { NgTemplateOutlet } from '@angular/common';
import { CngxCloseButton } from '@cngx/common/interactive';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { nextUid } from '@cngx/core/utils';

import { CNGX_POPOVER_ARROW_BOUNDS, type CngxPopoverArrowBounds } from './popover-arrow-bounds';
import { CNGX_POPOVER_PANEL_CONFIG } from './popover-panel.config';
import {
  CngxPopoverArrow,
  type CngxPopoverArrowContext,
  CngxPopoverClose,
  CngxPopoverEmpty,
  CngxPopoverError,
  CngxPopoverFooter,
  CngxPopoverHeader,
  CngxPopoverLoading,
} from './popover-panel-slots';
import { CngxPopover } from './popover.directive';
import type { PopoverPanelRole } from './popover.types';

/**
 * Rich popover panel molecule with header/body/footer slots, variant
 * styling, arrow, close button, and content state templates.
 *
 * Composes `CngxPopover` via `hostDirectives` - all popover inputs
 * (`placement`, `offset`, `closeOnEscape`, `mode`, `exclusive`,
 * `cngxPopoverOpen`) are forwarded.
 *
 * The `variant` input is a free-form string mapped to a CSS class
 * (`cngx-popover-panel--{variant}`). Five variants are pre-themed
 * in `popover-panel-theme.scss`: `default`, `info`, `warning`,
 * `danger`, `success`. Add custom variants via CSS.
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
 *
 * @category common/popover
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-panel.component.ts
 * @since 0.1.0
 * @relatedTo CngxPopover, CngxPopoverAction, CngxPopoverHeader, CngxPopoverBody, CngxPopoverFooter
 * <example-url>http://localhost:4200/#/common/popover/popover-panel/content-states</example-url>
 * <example-url>http://localhost:4200/#/common/popover/popover-panel/variants</example-url>
 * <example-url>http://localhost:4200/#/common/popover/popover-panel/with-footer-actions</example-url>
 */
@Component({
  selector: 'cngx-popover-panel',
  standalone: true,
  imports: [NgTemplateOutlet, CngxCloseButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxPopoverPanel',
  providers: [{ provide: CNGX_POPOVER_ARROW_BOUNDS, useExisting: CngxPopoverPanel }],
  hostDirectives: [
    {
      directive: CngxPopover,
      inputs: [
        'placement',
        'positionTryFallbacks',
        'offset',
        'closeOnEscape',
        'mode',
        'exclusive',
        'cngxPopoverOpen',
      ],
    },
  ],
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': 'role()',
    '[attr.aria-labelledby]': 'headerId',
    '[attr.aria-describedby]': 'ariaDescribedBy()',
    '[attr.aria-busy]': 'effectiveLoading() || null',
  },
  template: `
    @if (showArrow()) {
      @if (arrowTpl(); as tpl) {
        <ng-container *ngTemplateOutlet="tpl; context: arrowContext()" />
      } @else {
        <div class="cngx-popover-panel__arrow"></div>
      }
    }

    @if (effectiveLoading()) {
      @if (loadingTpl(); as tpl) {
        <div class="cngx-popover-panel__loading">
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        </div>
      }
    } @else if (effectiveError(); as err) {
      @if (errorTpl(); as tpl) {
        <div class="cngx-popover-panel__error">
          <ng-container *ngTemplateOutlet="tpl.templateRef; context: { $implicit: err }" />
        </div>
      }
    } @else if (effectiveEmpty()) {
      @if (emptyTpl(); as tpl) {
        <div class="cngx-popover-panel__empty">
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        </div>
      }
    } @else {
      @if (hasHeader() || showClose()) {
        <div class="cngx-popover-panel__header-row">
          <div class="cngx-popover-panel__header" [id]="headerId">
            <ng-content select="[cngxPopoverHeader]" />
          </div>
          @if (showClose()) {
            @if (closeTpl(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl.templateRef" />
            } @else {
              <cngx-close-button
                label="Close"
                class="cngx-popover-panel__close"
                (click)="popover.hide()"
              />
            }
          }
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
  styleUrls: ['./popover-panel.component.css'],
})
export class CngxPopoverPanel implements CngxPopoverArrowBounds {
  /** The underlying popover state machine. */
  readonly popover = inject(CngxPopover, { self: true });
  private readonly config = inject(CNGX_POPOVER_PANEL_CONFIG);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Cached panel border-radius. Read lazily from the host's computed
   * style on first access so `CngxPopover` can consume it via
   * `CNGX_POPOVER_ARROW_BOUNDS` without forcing a layout flush per
   * resize tick. The custom property is declared on `:scope` so the
   * value is valid from instantiation onward.
   */
  private _cachedBorderRadius: number | null = null;

  /** @internal - implements `CngxPopoverArrowBounds`. */
  get borderRadius(): number {
    if (this._cachedBorderRadius === null) {
      const raw = getComputedStyle(this.hostRef.nativeElement).getPropertyValue(
        '--cngx-popover-panel-border-radius',
      );
      this._cachedBorderRadius = Number.parseFloat(raw) || 12;
    }
    return this._cachedBorderRadius;
  }

  /**
   * Variant string - mapped to CSS class `cngx-popover-panel--{variant}`.
   * Pre-themed: `default`, `info`, `warning`, `danger`, `success`.
   * Add custom variants via CSS.
   */
  readonly variant = input<string | undefined>(undefined);

  /**
   * ARIA role applied to the panel host. Defaults to `'dialog'` because
   * the panel pairs `aria-labelledby` (header) with `aria-describedby`
   * (body) - the standard dialog pattern. Override with `'alertdialog'`
   * for irrecoverable confirmations, `'tooltip'` for passive callouts,
   * or `'menu'` when the panel hosts a menu.
   *
   * The trigger's `aria-haspopup` is hinted to `'dialog'` in tandem via
   * the popover's `haspopup` signal; consumers overriding `role` here
   * should also override `haspopup` on the trigger to match.
   */
  readonly role = input<PopoverPanelRole>('dialog');

  /** Show a close button. Falls back to global config from `providePopoverPanel(withCloseButton())`. */
  readonly showCloseInput = input<boolean | undefined>(undefined, { alias: 'showClose' });

  /** Show an arrow. Falls back to global config from `providePopoverPanel(withArrow())`. */
  readonly showArrowInput = input<boolean | undefined>(undefined, { alias: 'showArrow' });

  /** Resolved showClose - input takes precedence over config. */
  readonly showClose = computed(() => this.showCloseInput() ?? this.config.showClose ?? false);

  /** Resolved showArrow - input takes precedence over config. */
  readonly showArrow = computed(() => this.showArrowInput() ?? this.config.showArrow ?? false);

  /**
   * Bind an async state - drives loading, error, and empty slots from a single source.
   * When set, takes precedence over individual `[loading]`, `[error]`, `[empty]` inputs.
   */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** Whether the panel content is in a loading state. Fallback when `[state]` is not set. */
  readonly loading = input(false);

  /** Error value when content loading failed. Fallback when `[state]` is not set. */
  readonly error = input<unknown>(undefined);

  /** Whether the panel content is empty. Fallback when `[state]` is not set. */
  readonly empty = input(false);

  /** @internal Resolved loading - state takes precedence over boolean input. */
  protected readonly effectiveLoading = computed(
    () => this.state()?.isFirstLoad() ?? this.loading(),
  );

  /** @internal Resolved error - state takes precedence over direct input. */
  protected readonly effectiveError = computed(() => this.state()?.error() ?? this.error());

  /** @internal Resolved empty - state takes precedence over boolean input. */
  protected readonly effectiveEmpty = computed(() => this.state()?.isEmpty() ?? this.empty());

  protected readonly headerSlot = contentChild(CngxPopoverHeader);
  protected readonly footerSlot = contentChild(CngxPopoverFooter);
  protected readonly closeTpl = contentChild(CngxPopoverClose);
  protected readonly loadingTpl = contentChild(CngxPopoverLoading);
  protected readonly emptyTpl = contentChild(CngxPopoverEmpty);
  protected readonly errorTpl = contentChild(CngxPopoverError);
  protected readonly arrowTplDirective = contentChild(CngxPopoverArrow);

  /**
   * Three-stage cascade for the arrow ornament:
   * 1. Per-instance `*cngxPopoverArrow` template (contentChild).
   * 2. App-wide `CNGX_POPOVER_PANEL_CONFIG.templates.arrow`
   *    (via `providePopoverPanel(withArrowTemplate(...))`).
   * 3. `null` -> the panel renders the default rotated-diamond markup.
   */
  protected readonly arrowTpl = computed(
    () => this.arrowTplDirective()?.templateRef ?? this.config.templates?.arrow ?? null,
  );

  /**
   * Context surface for projected `*cngxPopoverArrow` templates.
   * `equal` keeps the reference stable across re-evaluations whose
   * inputs round-trip to the same `{ edge, offsetPx }` - required for
   * any object-returning computed per the Equality discipline rule.
   */
  protected readonly arrowContext = computed<CngxPopoverArrowContext>(
    () => {
      const raw = this.popover.arrowOffset();
      const parsed = raw === null ? null : Number.parseFloat(raw);
      return {
        edge: this.popover.resolvedEdge(),
        offsetPx: parsed !== null && Number.isFinite(parsed) ? parsed : null,
      };
    },
    { equal: (a, b) => a.edge === b.edge && a.offsetPx === b.offsetPx },
  );

  /** Auto-detected from projected `[cngxPopoverHeader]` content. */
  protected readonly hasHeader = computed(() => !!this.headerSlot());

  /** Auto-detected from projected `[cngxPopoverFooter]` content. */
  protected readonly hasFooter = computed(() => !!this.footerSlot());

  private readonly uid = nextUid('cngx-pp');
  protected readonly headerId = `${this.uid}-header`;
  protected readonly bodyId = `${this.uid}-body`;

  /** Only point to body when default content is showing (not loading/error/empty). */
  protected readonly ariaDescribedBy = computed(() =>
    this.effectiveLoading() || this.effectiveError() || this.effectiveEmpty() ? null : this.bodyId,
  );

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
    // Hint any CngxPopoverTrigger pointing at this popover to default
    // `aria-haspopup="dialog"`. Consumer override on the trigger wins.
    this.popover.haspopup.set('dialog');

    effect(() => {
      const isVisible = this.popover.isVisible();
      const v = this.variant() ?? untracked(() => this.config.defaultVariant) ?? 'default';
      const timing = untracked(() => this.config.autoDismiss);

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
