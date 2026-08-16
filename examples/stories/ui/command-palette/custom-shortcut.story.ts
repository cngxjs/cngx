import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCommandPalette: custom open shortcut',
  subtitle:
    'This instance opens with Cmd/Ctrl+Shift+P instead of the default Cmd/Ctrl+K, set per-instance via [openShortcut]. The combo string is parsed with parseKeyCombo; changing it live re-installs the listener.',
  description:
    'Resolution is instance [openShortcut] > CNGX_COMMAND_PALETTE_CONFIG.openShortcut (withPaletteShortcut, app-wide or per-scope) > the mod+k default. For a full listener swap (enterprise key-capture), override CNGX_PALETTE_KEYBINDING_FACTORY instead. The default-shortcut palette lives at /ui/command-palette/basic.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  references: [
    {
      label: 'WAI-ARIA APG: Dialog (Modal) pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    },
  ],
  apiComponents: ['CngxCommandPalette', 'CngxCommandPaletteTrigger'],
  moduleImports: ["import { provideCommands } from '@cngx/common/command';"],
  imports: ['CngxCommandPalette', 'CngxCommandPaletteTrigger'],
  viewProviders: [
    `provideCommands([
      { id: 'scroll-top', label: 'Scroll to top', keywords: ['top'], group: 'Navigation', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
      { id: 'theme', label: 'Toggle theme', keywords: ['dark', 'light'], group: 'Appearance', run: () => (document.documentElement.dataset['theme'] = document.documentElement.dataset['theme'] === 'dark' ? 'light' : 'dark') },
    ])`,
  ],
  templateChromeBefore: `<p class="demo-hint">
    Press <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> (or the button).
    <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> does nothing here - this instance rebound the combo.
  </p>`,
  template: `  <button type="button" class="demo-cmdk-trigger" [cngxCommandPaletteTrigger]="palette">
    Open commands <kbd>Cmd Shift P</kbd>
  </button>
  <cngx-command-palette
    #palette
    [openShortcut]="'mod+shift+p'"
    ariaLabel="Custom-shortcut command palette"
  />`,
};
