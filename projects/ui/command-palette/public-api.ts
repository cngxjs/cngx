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
