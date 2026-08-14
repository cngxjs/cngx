import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCommandPalette: basic',
  subtitle:
    'Cmd/Ctrl+K opens a modal dialog that type-filters the DI command registry into grouped results; arrow keys move aria-activedescendant, Enter runs the command and closes, Esc restores focus to the trigger.',
  description:
    'The opinionated preset from @cngx/ui/command-palette over the headless @cngx/common/command registry. Commands register through CNGX_COMMAND_SOURCE and run real actions here (density, theme, scroll), grouped into Appearance and Navigation. The molecule this composes - the raw CngxListboxSearch + listbox seam - lives at /common/interactive/listbox/search/command-palette.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Combobox pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    },
    {
      label: 'WAI-ARIA APG: Dialog (Modal) pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
    },
  ],
  apiComponents: ['CngxCommandPalette', 'CngxCommandPaletteTrigger'],
  moduleImports: ["import { CNGX_COMMAND_SOURCE } from '@cngx/common/command';"],
  imports: ['CngxCommandPalette', 'CngxCommandPaletteTrigger'],
  viewProviders: [
    `{
      provide: CNGX_COMMAND_SOURCE,
      multi: true,
      useValue: [
        { id: 'density-compact', label: 'Compact density', keywords: ['spacing'], group: 'Appearance', run: () => (document.documentElement.dataset['density'] = 'compact') },
        { id: 'density-comfortable', label: 'Comfortable density', keywords: ['spacing'], group: 'Appearance', run: () => (document.documentElement.dataset['density'] = 'comfortable') },
        { id: 'theme-dark', label: 'Dark theme', keywords: ['color', 'night'], group: 'Appearance', run: () => (document.documentElement.dataset['theme'] = 'dark') },
        { id: 'theme-light', label: 'Light theme', keywords: ['color', 'day'], group: 'Appearance', run: () => (document.documentElement.dataset['theme'] = 'light') },
        { id: 'scroll-top', label: 'Scroll to top', keywords: ['top'], group: 'Navigation', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
        { id: 'scroll-bottom', label: 'Scroll to bottom', keywords: ['end'], group: 'Navigation', run: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }) },
      ],
    }`,
  ],
  templateChromeBefore: `<p class="demo-hint">
    Press <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> (or click below), type to filter,
    arrow to a command, <kbd>Enter</kbd> to run. <kbd>Esc</kbd> closes and returns focus.
  </p>`,
  template: `  <button type="button" class="demo-cmdk-trigger" [cngxCommandPaletteTrigger]="palette">
    Search commands <kbd>Cmd K</kbd>
  </button>
  <cngx-command-palette #palette ariaLabel="Demo command palette" />`,
};
