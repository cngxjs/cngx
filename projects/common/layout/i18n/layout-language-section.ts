// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The layout section of a {@link CngxLanguagePack}: the copy of the
 * `@cngx/common/layout` atoms. It feeds `CNGX_LAYOUT_I18N`.
 *
 * @since 0.1.0
 * @relatedTo CNGX_LAYOUT_I18N
 */
export interface CngxLayoutLanguageSection {
  /** Label of the `CngxExpandableText` expand control. */
  readonly expandableTextMore: string;
  /** Label of the `CngxExpandableText` collapse control. */
  readonly expandableTextLess: string;
  /** Accessible name of a `CngxResizable` handle. */
  readonly resizeHandle: string;
  /** `aria-valuetext` of a `CngxResizable` handle. Placeholder: `{size}` (px). */
  readonly resizeValueText: CngxMessage;
  /** Accessible name of a `CngxPanelTrigger` without text content whose panel has no label. */
  readonly panelTrigger: string;
  /** Accessible name of a `CngxSidebar` region without a bound label. */
  readonly sidebarRegion: string;
  /** Accessible name of an open page-modal drawer panel or surface without a bound label. */
  readonly drawerDialog: string;
}

/**
 * The English layout section: the single source of the layout atoms'
 * English copy. `CNGX_LAYOUT_I18N` defaults to it.
 *
 * @since 0.1.0
 * @relatedTo CNGX_LAYOUT_I18N
 */
export const CNGX_LAYOUT_LANGUAGE_EN: CngxLayoutLanguageSection = {
  expandableTextMore: 'Show more',
  expandableTextLess: 'Show less',
  resizeHandle: 'Resize',
  resizeValueText: '{size} pixels',
  panelTrigger: 'Panel',
  sidebarRegion: 'Sidebar',
  drawerDialog: 'Drawer',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly layout: CngxLayoutLanguageSection;
  }
}
