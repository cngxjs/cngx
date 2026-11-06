import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  signal,
} from '@angular/core';
import { createActivationKeyHandler } from '@cngx/common/interactive';

import { injectLayoutI18n } from '../i18n/layout-i18n';
import { CNGX_PANEL_TARGET, type CngxPanelTarget } from './panel-target';

/**
 * What a `CngxPanelTrigger` does on activation.
 *
 * @since 0.1.0
 */
export type CngxPanelTriggerAction = 'toggle' | 'peek';

/**
 * The trigger of a drawer, sidebar or sidenav panel. It owns no state: it
 * mirrors the target's `expanded` as `aria-expanded`, points
 * `aria-controls` at the target's `id`, and calls `toggle()` (or `peek()`)
 * on click, Enter and Space.
 *
 * The target is an explicit reference (`[cngxPanelTrigger]="drawer"`). A
 * bare `cngxPanelTrigger` inside the panel resolves the surrounding
 * `CNGX_PANEL_TARGET` (a pin or close button). Because the trigger names
 * the panel in `aria-controls`, a press on it is not an outside press for
 * the panel's dismissal, so one press toggles once.
 *
 * On a native `<button>` the browser turns Enter and Space into the click.
 * Any other host gets `role="button"`, `tabindex="0"` and its own
 * Enter / Space handling. An icon-only trigger (no text content; text
 * inside `hidden` or `aria-hidden` elements does not count) is named after
 * the panel: a bound `label`, else a static `aria-label`, else the
 * target's `label`, else
 * `CNGX_LAYOUT_I18N.panelTrigger`. The name stays the same while the panel
 * opens and closes; `aria-expanded` carries the state. A trigger with
 * visible text keeps its text as its name. The check follows the host
 * content: text added to or removed from the trigger later (an
 * interpolation, an `@if`) switches between the two.
 *
 * The trigger draws nothing: the host's content is the consumer's. For an
 * icon button with a glyph that follows the panel, use
 * `button[cngxPanelToggle]`, which composes this directive.
 *
 * ```html
 * <button type="button" [cngxPanelTrigger]="drawer">Menu</button>
 * <div cngxDrawer #drawer="cngxDrawer" panelId="nav">
 *   <nav [cngxDrawerPanel]="drawer">…</nav>
 * </div>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/panel-trigger/panel-trigger.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPanelToggle, CngxPanelTarget, CNGX_PANEL_TARGET, CngxDrawer, CngxSidebar
 * <example-url>/#/common/layout/sidebar/clipped-below-header</example-url>
 * <example-url>/#/common/layout/sidebar/collapsible-rail</example-url>
 * <example-url>/#/common/layout/sidebar/inset-app-sidebar</example-url>
 * <example-url>/#/common/layout/drawer/app-header-clipped</example-url>
 * <example-url>/#/common/layout/drawer/full-height-modal</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxPanelTrigger]',
  exportAs: 'cngxPanelTrigger',
  standalone: true,
  host: {
    '[attr.aria-expanded]': 'expanded()',
    '[attr.aria-controls]': 'controls()',
    '[attr.aria-label]': 'resolvedLabel()',
    '[attr.role]': "nativeButton ? null : 'button'",
    '[attr.tabindex]': "nativeButton ? null : '0'",
    '(click)': 'activate()',
    '(keydown.enter)': 'handleActivationKey($event)',
    '(keydown.space)': 'handleActivationKey($event)',
  },
})
export class CngxPanelTrigger {
  /**
   * The panel to control. Bind it explicitly, or leave the attribute bare
   * inside a panel that provides `CNGX_PANEL_TARGET`.
   */
  readonly targetInput = input<CngxPanelTarget | undefined, CngxPanelTarget | '' | undefined>(
    undefined,
    {
      alias: 'cngxPanelTrigger',
      transform: (v) => (typeof v === 'string' ? undefined : v),
    },
  );
  /**
   * `toggle` (default) flips the panel. `peek` shows it temporarily; a target
   * without `peek()` toggles instead.
   */
  readonly action = input<CngxPanelTriggerAction>('toggle');
  /**
   * Accessible name. Unbound, a static `aria-label` on the host stays; on a
   * trigger without text content or a static `aria-label` it falls back to
   * the target's `label`, then to `CNGX_LAYOUT_I18N.panelTrigger`. It does
   * not follow the panel state; `aria-expanded` does.
   */
  readonly label = input<string | undefined>(undefined);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly providedTarget = inject(CNGX_PANEL_TARGET, { optional: true });
  private readonly i18n = injectLayoutI18n();
  // The aria-label binding would drop a static aria-label, so it renders it.
  private readonly staticLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly rendered = signal(false);
  // Bumped by a MutationObserver on the host: the text and the attributes
  // that decide the name are not signals, so hasOwnName reads the DOM and
  // tracks this version instead of a written copy.
  private readonly nameVersion = signal(0);
  // Until the first render the projected content is not there yet; assume a
  // named trigger so no fallback label flashes onto a text trigger.
  private readonly hasOwnName = computed(() => {
    if (!this.rendered()) {
      return true;
    }
    this.nameVersion();
    return nameText(this.host).trim() !== '' || this.host.hasAttribute('aria-labelledby');
  });

  protected readonly nativeButton = this.host.tagName === 'BUTTON';

  /** The resolved target: the explicit reference wins over the provided one. */
  readonly target = computed(() => this.targetInput() ?? this.providedTarget);

  /** Whether the controlled panel is shown. */
  readonly expanded = computed(() => this.target()?.expanded() ?? false);

  protected readonly controls = computed(() => {
    const id = this.target()?.id();
    return id === undefined || id === '' ? null : id;
  });
  private readonly fallbackLabel = computed(() => {
    if (this.hasOwnName()) {
      return null;
    }
    return this.target()?.label?.() ?? this.i18n().panelTrigger;
  });
  protected readonly resolvedLabel = computed(
    () => this.label() ?? this.staticLabel ?? this.fallbackLabel(),
  );

  protected readonly handleActivationKey = createActivationKeyHandler(this.host, () =>
    this.activate(),
  );

  constructor() {
    let observer: MutationObserver | null = null;
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
    afterNextRender(() => {
      this.rendered.set(true);
      if (typeof MutationObserver === 'undefined') {
        return;
      }
      observer = new MutationObserver(() => this.nameVersion.update((v) => v + 1));
      observer.observe(this.host, {
        characterData: true,
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden', 'aria-hidden', 'aria-labelledby'],
      });
    });
  }

  /** Runs the action on the target. */
  activate(): void {
    const target = this.target();
    if (!target) {
      return;
    }
    if (this.action() === 'peek' && target.peek) {
      target.peek();
      return;
    }
    target.toggle();
  }
}

/**
 * The text that names the host: its text content without `hidden` and
 * `aria-hidden` subtrees, which the accessible name skips as well (a
 * component's hidden disabled reason, an `aria-hidden` glyph slot).
 */
function nameText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }
  return Array.from(node.childNodes)
    .filter(
      (child) =>
        !(child instanceof Element) ||
        !(child.hasAttribute('hidden') || child.getAttribute('aria-hidden') === 'true'),
    )
    .map(nameText)
    .join('');
}
