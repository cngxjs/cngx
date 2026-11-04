import {
  afterNextRender,
  computed,
  Directive,
  ElementRef,
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
 * Enter / Space handling. An icon-only trigger (no text content) is named
 * from `CNGX_LAYOUT_I18N.panelTrigger` unless `label` is bound; a trigger
 * with visible text keeps its text as its name.
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
   * Accessible name. Falls back to `CNGX_LAYOUT_I18N.panelTrigger` on a
   * trigger without text content.
   */
  readonly label = input<string | undefined>(undefined);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly providedTarget = inject(CNGX_PANEL_TARGET, { optional: true });
  private readonly i18n = injectLayoutI18n();
  private readonly hasOwnName = signal(true);

  protected readonly nativeButton = this.host.tagName === 'BUTTON';

  /** The resolved target: the explicit reference wins over the provided one. */
  readonly target = computed(() => this.targetInput() ?? this.providedTarget);

  /** Whether the controlled panel is shown. */
  readonly expanded = computed(() => this.target()?.expanded() ?? false);

  protected readonly controls = computed(() => {
    const id = this.target()?.id();
    return id === undefined || id === '' ? null : id;
  });
  protected readonly resolvedLabel = computed(() => {
    const label = this.label();
    if (label !== undefined) {
      return label;
    }
    return this.hasOwnName() ? null : this.i18n().panelTrigger;
  });

  protected readonly handleActivationKey = createActivationKeyHandler(this.host, () =>
    this.activate(),
  );

  constructor() {
    afterNextRender(() =>
      this.hasOwnName.set(
        (this.host.textContent ?? '').trim() !== '' || this.host.hasAttribute('aria-labelledby'),
      ),
    );
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
