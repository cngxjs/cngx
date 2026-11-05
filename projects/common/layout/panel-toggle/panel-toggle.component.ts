import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectButtonCore, provideButtonDescribedBy } from '@cngx/common/button';
import type {
  CngxButtonSize,
  CngxButtonTone,
  CngxButtonType,
  CngxButtonVariant,
} from '@cngx/common/button';
import { CngxIconSvg } from '@cngx/common/display';
import { CNGX_HOST_INTERACTION_STATE } from '@cngx/common/interactive';
import { injectDirection } from '@cngx/core';
import {
  CNGX_ICON_MENU,
  CNGX_ICON_PANEL_CLOSE,
  CNGX_ICON_PANEL_OPEN,
  CNGX_ICON_X,
} from '@cngx/utils';

import { CngxPanelTrigger } from '../panel-trigger/panel-trigger.directive';

/**
 * Icon button that opens and closes a drawer or sidebar and draws its own
 * glyph. The behaviour is a composed `CngxPanelTrigger`: `aria-expanded`
 * mirrors the panel, `aria-controls` names it, a press toggles it (or peeks
 * it with `action="peek"`), and the accessible name is the panel's: a
 * bound `label`, else the target's `label`, else
 * `CNGX_LAYOUT_I18N.panelTrigger`. The name stays the same while the panel
 * opens and closes.
 *
 * The glyph follows how the target presents the panel right now, so it
 * changes with a breakpoint that switches the panel's `mode`:
 *
 * - a modal over-drawer (the mobile nav: `mode="over"` with a `page` or
 *   `contained` modality) shows three bars while closed and a cross while
 *   open;
 * - every other presentation (an inline sidebar or rail, a push drawer, a
 *   non-modal over-drawer) shows a panel glyph that draws what a press
 *   does: a frame with a column on the panel's side and a chevron pointing
 *   away from the column while the panel is closed (open it), toward the
 *   column while it is open (close it). `aria-expanded` carries the same
 *   state for assistive technology. The glyph mirrors for a panel
 *   on the right: `position="right"`, or the end side in LTR and the start
 *   side in RTL (`CNGX_DIRECTION`).
 *
 * A target without `mode` / `modal` / `side` (a consumer-built
 * `CngxPanelTarget`) reads as an inline panel on the start side. The glyph
 * is `aria-hidden`; project an icon to replace it. The state the default
 * glyph follows is public on the exported instance (`expanded`,
 * `modalOverlay`, `mirrored`), so a projected glyph can follow it too:
 *
 * ```html
 * <button type="button" [cngxPanelToggle]="nav" #toggle="cngxPanelToggle">
 *   <cngx-icon [style.transform]="toggle.mirrored() ? 'scaleX(-1)' : null">
 *     <mat-icon>{{ toggle.expanded() ? 'menu_open' : 'menu' }}</mat-icon>
 *   </cngx-icon>
 * </button>
 * ```
 *
 * Shares the button family's state surface: `disabled` renders
 * `aria-disabled` (the button stays focusable and swallows activation) and
 * `disabledReason` is read through `aria-describedby`. The emphasis stays
 * `ghost` unless `variant` is set; `size` and `tone` fall through to the
 * group, `provideButtonConfig` and the icon-button defaults.
 *
 * ```html
 * <button type="button" [cngxPanelToggle]="nav"></button>
 * <div cngxDrawer #nav="cngxDrawer" panelId="main-nav">
 *   <nav [cngxDrawerPanel]="nav" [mode]="mobile() ? 'over' : 'push'">…</nav>
 * </div>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/panel-toggle/panel-toggle.component.ts
 * @since 0.1.0
 * @relatedTo CngxPanelTrigger, CngxPanelTarget, CngxDrawer, CngxSidebar, CngxIconButton
 * <example-url>/#/common/layout/sidebar/inset-app-sidebar</example-url>
 * <example-url>/#/common/layout/sidebar/collapsible-rail</example-url>
 * <example-url>/#/common/layout/drawer/app-header-clipped</example-url>
 * <example-url>/#/common/layout/drawer/full-height-modal</example-url>
 * <example-url>/#/common/layout/drawer/filter-panel-push</example-url>
 * <example-url>/#/common/layout/sidebar/projected-toggle-glyph</example-url>
 * @axis level molecule
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[cngxPanelToggle]',
  standalone: true,
  exportAs: 'cngxPanelToggle',
  imports: [CngxIconSvg],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxPanelTrigger,
      inputs: ['cngxPanelTrigger: cngxPanelToggle', 'action', 'label'],
    },
  ],
  providers: [
    { provide: CNGX_HOST_INTERACTION_STATE, useExisting: CngxPanelToggle },
    provideButtonDescribedBy('CngxPanelToggle'),
  ],
  host: {
    class: 'cngx-button cngx-icon-button cngx-panel-toggle',
    '[attr.data-variant]': 'core.variant()',
    '[attr.data-tone]': 'core.tone()',
    '[attr.data-size]': 'core.size()',
    '[attr.data-busy]': 'core.busyAttr()',
    '[attr.data-pending]': 'core.pendingAttr()',
    '[attr.aria-disabled]': 'core.ariaDisabled()',
    '[attr.aria-describedby]': 'core.describedBy()',
    '[attr.type]': 'core.hostType()',
    '[attr.disabled]': 'null',
  },
  template: `
    <span class="cngx-button__label cngx-icon-button__glyph" aria-hidden="true">
      <ng-content>
        <svg
          class="cngx-panel-toggle__icon"
          [class.cngx-panel-toggle__icon--mirrored]="mirrored()"
          [cngxIconSvg]="icon()"
        ></svg>
      </ng-content>
    </span>
    @if (core.busyVisible()) {
      <span class="cngx-button__busy" aria-hidden="true">
        <span class="cngx-button__spinner"></span>
      </span>
    }
    <span class="cngx-button__reason" [id]="core.reasonId" hidden>{{ disabledReason() }}</span>
  `,
  styleUrls: [
    '../../button/button.component.css',
    '../../button/icon-button.component.css',
    './panel-toggle.component.css',
  ],
})
export class CngxPanelToggle {
  /** Emphasis. Defaults to `ghost`. */
  readonly variant = input<CngxButtonVariant | undefined>(undefined);

  /** Intent. Falls through to the config and `neutral`. */
  readonly tone = input<CngxButtonTone | undefined>(undefined);

  /** Visual size of the square box. Falls through to the group, the config and `md`. */
  readonly size = input<CngxButtonSize | undefined>(undefined);

  /** Rendered as `aria-disabled`; the element stays focusable and activation is swallowed. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Why the button is disabled; referenced through `aria-describedby` while disabled. */
  readonly disabledReason = input<string | undefined>(undefined);

  /**
   * Ids of external description elements, space-separated, joined into the
   * button's `aria-describedby` after a static `aria-describedby` and before
   * the disabled reason.
   */
  readonly describedBy = input<string | null>(null, {
    alias: 'cngxDescribedBy',
  });

  /** Native `type`. Defaults to `'button'`. */
  readonly type = input<CngxButtonType | undefined>(undefined);

  private readonly trigger = inject(CngxPanelTrigger, { host: true });
  private readonly direction = injectDirection();

  /**
   * Whether the target shows the panel right now. Read it from a projected
   * glyph through `#toggle="cngxPanelToggle"`.
   */
  readonly expanded = this.trigger.expanded;

  /**
   * Whether the target presents the panel as a modal over-drawer right now
   * (`mode="over"` with a blocking modality). The default glyph draws menu
   * bars and a cross then; a projected glyph can follow the same switch.
   */
  readonly modalOverlay = computed(() => {
    const target = this.trigger.target();
    const mode = target?.mode?.() ?? 'inline';
    return mode === 'over' && (target?.modal?.() ?? false);
  });

  /**
   * Whether a panel glyph drawn for a left panel must be flipped: the panel
   * sits on the right (`right`, `end` in LTR, `start` in RTL). Always
   * `false` while {@link modalOverlay} holds.
   */
  readonly mirrored = computed(() => {
    if (this.modalOverlay()) {
      return false;
    }
    const side = this.trigger.target()?.side?.() ?? 'start';
    const rtl = this.direction() === 'rtl';
    switch (side) {
      case 'right':
        return true;
      case 'start':
        return rtl;
      case 'end':
        return !rtl;
      default:
        return false;
    }
  });

  /** @internal - the default glyph for the current presentation and state. */
  protected readonly icon = computed(() => {
    const expanded = this.expanded();
    if (this.modalOverlay()) {
      return expanded ? CNGX_ICON_X : CNGX_ICON_MENU;
    }
    return expanded ? CNGX_ICON_PANEL_CLOSE : CNGX_ICON_PANEL_OPEN;
  });

  /** @internal */
  protected readonly core = injectButtonCore(
    {
      variant: this.variant,
      tone: this.tone,
      size: this.size,
      disabled: this.disabled,
      disabledReason: this.disabledReason,
      describedBy: this.describedBy,
      type: this.type,
    },
    { variant: 'ghost' },
  );
}
