import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCommandPalette: custom row slot',
  subtitle:
    'The *cngxCommandRow slot replaces the built-in row: icon, label, and shortcut hint are laid out by the consumer, read from the command payload (command.data). The palette keeps navigation, ARIA, and Enter-to-run; only the row visuals eject.',
  description:
    'Region-granularity slot override: one *cngxCommandRow template owns the whole row, narrowing command.data at the use-site. Resolution is instance slot > CNGX_COMMAND_PALETTE_CONFIG.templates > built-in default, so re-skinning never forces a fork. The basic (default-skin) palette lives at /ui/command-palette/basic.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  references: [
    {
      label: 'WAI-ARIA APG: Combobox pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    },
  ],
  apiComponents: ['CngxCommandPalette', 'CngxCommandRow'],
  moduleImports: ["import { provideCommands } from '@cngx/common/command';"],
  imports: ['CngxCommandPalette', 'CngxCommandPaletteTrigger', 'CngxCommandRow'],
  viewProviders: [
    `provideCommands([
      { id: 'new', label: 'New file', keywords: ['create'], group: 'File', data: { icon: '📄', shortcut: 'Cmd N' }, run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
      { id: 'save', label: 'Save', keywords: ['write'], group: 'File', data: { icon: '💾', shortcut: 'Cmd S' }, run: () => (document.documentElement.dataset['theme'] = 'light') },
      { id: 'theme', label: 'Toggle theme', keywords: ['dark', 'light'], group: 'View', data: { icon: '🌓', shortcut: 'Cmd J' }, run: () => (document.documentElement.dataset['theme'] = 'dark') },
    ])`,
  ],
  templateChromeBefore: `<p class="demo-hint">
    Open with <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> or the button. Each row renders
    the consumer's own icon + label + shortcut from <code>command.data</code>.
  </p>`,
  template: `  <button type="button" class="demo-cmdk-trigger" [cngxCommandPaletteTrigger]="palette">
    Search commands <kbd>Cmd K</kbd>
  </button>
  <cngx-command-palette #palette ariaLabel="Custom-row command palette">
    <ng-template cngxCommandRow let-entry let-active="active">
      <span class="demo-cmd-row" [class.demo-cmd-row--active]="active">
        <span class="demo-cmd-icon" aria-hidden="true">{{ $any(entry.command.data).icon }}</span>
        <span class="demo-cmd-label">{{ entry.command.label }}</span>
        <kbd class="demo-cmd-kbd">{{ $any(entry.command.data).shortcut }}</kbd>
      </span>
    </ng-template>
  </cngx-command-palette>`,
};
