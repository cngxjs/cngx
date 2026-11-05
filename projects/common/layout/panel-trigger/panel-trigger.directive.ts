import {
  afterNextRender,
  afterRenderEffect,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  Renderer2,
  signal,
} from '@angular/core';
import { createIconSvgElement, type CngxIconSvgElement } from '@cngx/common/display';
import { createActivationKeyHandler } from '@cngx/common/interactive';
import { CNGX_ICON_MENU, CNGX_ICON_X } from '@cngx/utils';

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
 * Enter / Space handling. An icon-only trigger (no text content) is named
 * by the panel state unless `label` is bound (text inside `hidden` or
 * `aria-hidden` elements does not count as a name):
 * `CNGX_LAYOUT_I18N.panelTriggerOpen` while the panel is hidden,
 * `panelTriggerClose` while it is shown. A trigger with visible text keeps
 * its text as its name.
 *
 * A host with no content of its own (no element, no text) gets a default
 * `aria-hidden` glyph: three bars while the panel is hidden, a cross while
 * it is shown. Project an icon or text to replace it; a host with content
 * is never touched. The glyph is written after render, never during SSR.
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
 * @relatedTo CngxPanelTarget, CNGX_PANEL_TARGET, CngxDrawer, CngxSidebar
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
   * Accessible name. On a trigger without text content it falls back to
   * `CNGX_LAYOUT_I18N.panelTriggerOpen` or `panelTriggerClose`, following
   * the panel state.
   */
  readonly label = input<string | undefined>(undefined);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly providedTarget = inject(CNGX_PANEL_TARGET, { optional: true });
  private readonly i18n = injectLayoutI18n();
  private readonly hasOwnName = signal(true);
  private readonly hasOwnContent = signal(true);
  private readonly renderer = inject(Renderer2);
  private glyph: CngxIconSvgElement | null = null;

  protected readonly nativeButton = this.host.tagName === 'BUTTON';

  /** The resolved target: the explicit reference wins over the provided one. */
  readonly target = computed(() => this.targetInput() ?? this.providedTarget);

  /** Whether the controlled panel is shown. */
  readonly expanded = computed(() => this.target()?.expanded() ?? false);

  protected readonly controls = computed(() => {
    const id = this.target()?.id();
    return id === undefined || id === '' ? null : id;
  });
  private readonly stateLabel = computed(() => {
    if (this.hasOwnName()) {
      return null;
    }
    const i18n = this.i18n();
    return this.expanded() ? i18n.panelTriggerClose : i18n.panelTriggerOpen;
  });
  protected readonly resolvedLabel = computed(() => this.label() ?? this.stateLabel());

  protected readonly handleActivationKey = createActivationKeyHandler(this.host, () =>
    this.activate(),
  );

  constructor() {
    afterNextRender(() => {
      this.hasOwnName.set(
        nameText(this.host).trim() !== '' || this.host.hasAttribute('aria-labelledby'),
      );
      this.hasOwnContent.set(hasContent(this.host));
    });

    afterRenderEffect({
      write: () => {
        if (this.hasOwnContent()) {
          return;
        }
        const icon = this.expanded() ? CNGX_ICON_X : CNGX_ICON_MENU;
        if (this.glyph) {
          this.glyph.setIcon(icon);
          return;
        }
        this.glyph = createIconSvgElement(this.renderer, icon, 'cngx-panel-trigger__icon');
        this.renderer.appendChild(this.host, this.glyph.element);
      },
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

/** Whether the host renders an element or non-blank text of its own. */
function hasContent(host: HTMLElement): boolean {
  return Array.from(host.childNodes).some(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== ''),
  );
}
