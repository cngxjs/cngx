/**
 * @module @cngx/ui/command-palette
 */
export { CngxCommandPalette } from './palette/command-palette.component';
export { CngxCommandPaletteTrigger } from './palette/command-palette-trigger.directive';
export {
  CNGX_COMMAND_PALETTE_HOST,
  type CngxCommandPaletteHost,
} from './panel/panel-host.token';
export {
  CNGX_PALETTE_KEYBINDING_FACTORY,
  createPaletteKeybinding,
  type CngxPaletteKeybinding,
  type CngxPaletteKeybindingFactory,
} from './palette/palette-keybinding';
export {
  CNGX_COMMAND_PALETTE_CONFIG,
  provideCommandPaletteConfig,
  provideCommandPaletteConfigAt,
  injectCommandPaletteConfig,
  withCommandPaletteLabels,
  withPaletteShortcut,
  withKeyboardLegend,
  withResultCountFormatter,
  withCommandPaletteTemplates,
  type CngxCommandPaletteConfig,
  type CngxCommandPaletteConfigFeature,
  type CngxCommandPaletteLegendEntry,
  type CngxCommandPaletteTemplates,
} from './config/command-palette-config';
export {
  CngxCommandRow,
  CngxCommandGroupHeader,
  CngxCommandPaletteEmpty,
  CngxCommandPaletteLoading,
  CngxCommandPaletteError,
  CngxCommandPaletteFooter,
  type CngxCommandRowContext,
  type CngxCommandGroupHeaderContext,
  type CngxCommandPaletteEmptyContext,
  type CngxCommandPaletteLoadingContext,
  type CngxCommandPaletteErrorContext,
  type CngxCommandPaletteFooterContext,
} from './slots/command-slots';
