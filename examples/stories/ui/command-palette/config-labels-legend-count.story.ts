import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'provideCommandPaletteConfigAt: config labels legend count',
  subtitle:
    'One <code>provideCommandPaletteConfigAt(...)</code> in <code>viewProviders</code> rewrites the palette copy for everything below it: <code>withCommandPaletteLabels</code> sets the input placeholder, the listbox and dialog names and the empty text, <code>withKeyboardLegend</code> replaces the footer legend, <code>withResultCountFormatter</code> builds the polite result-count announcement.',
  description:
    'Open the palette: the placeholder, the footer legend and, after typing something that matches nothing, the empty text are the configured copy. The dialog name and the live-region announcement are not visible, so the readout below mirrors them from the DOM; type to watch the announcement change. Keys the features leave unset keep the language-pack defaults, and a per-instance <code>[ariaLabel]</code> still wins over <code>paletteLabel</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WCAG 4.1.3 Status Messages',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages',
    },
  ],
  apiComponents: ['CngxCommandPalette', 'CngxCommandPaletteTrigger'],
  moduleImports: [
    "import { DestroyRef, ElementRef } from '@angular/core';",
    "import { provideCommands } from '@cngx/common/command';",
    "import { CngxCommandPalette, CngxCommandPaletteTrigger, provideCommandPaletteConfigAt, withCommandPaletteLabels, withKeyboardLegend, withResultCountFormatter } from '@cngx/ui/command-palette';",
  ],
  imports: ['CngxCommandPalette', 'CngxCommandPaletteTrigger'],
  viewProviders: [
    `provideCommands([
      { id: 'invite', label: 'Invite a teammate', keywords: ['member', 'people'], group: 'Project', run: () => {} },
      { id: 'archive', label: 'Archive project', keywords: ['close'], group: 'Project', run: () => {} },
      { id: 'export', label: 'Export as CSV', keywords: ['download'], group: 'Project', run: () => {} },
      { id: 'rename', label: 'Rename project', keywords: ['title'], group: 'Project', run: () => {} },
    ])`,
    `provideCommandPaletteConfigAt(
      withCommandPaletteLabels({
        searchPlaceholder: 'Search project actions',
        listboxLabel: 'Project actions',
        emptyLabel: 'No project action matches',
        paletteLabel: 'Project actions palette',
      }),
      withKeyboardLegend([
        { keys: '↑ ↓', spokenKeys: 'Up and Down arrows', label: 'Move' },
        { keys: 'Enter', label: 'Execute' },
        { keys: 'Esc', label: 'Dismiss' },
      ]),
      withResultCountFormatter((count) =>
        count === 0 ? 'No action matches' : count === 1 ? 'One action matches' : count + ' actions match',
      ),
    )`,
  ],
  templateChromeBefore: `<p class="demo-hint">
    Open with <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> or the button, then type, for example
    <kbd>ex</kbd> or <kbd>zz</kbd>.
  </p>`,
  template: `  <button type="button" class="demo-cmdk-trigger" [cngxCommandPaletteTrigger]="palette">
    Project actions <kbd>Cmd K</kbd>
  </button>
  <cngx-command-palette #palette />`,
  setupChrome: `private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly dialogName = signal('-');
  protected readonly announcement = signal('-');
  private readonly mirror = afterNextRender(() => {
    const host = this.hostEl.nativeElement.querySelector('cngx-command-palette');
    if (!host) {
      return;
    }
    const read = () => {
      const dialog = host.querySelector('dialog.cngx-command-palette');
      const region = host.querySelector('.cngx-command-panel > [aria-live]');
      this.dialogName.set(dialog?.getAttribute('aria-label') ?? '-');
      this.announcement.set(region?.textContent?.trim() || '-');
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(host, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label'] });
    this.destroyRef.onDestroy(() => observer.disconnect());
  });`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Dialog name</span>
      <span class="event-value">{{ dialogName() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Live region</span>
      <span class="event-value">{{ announcement() }}</span>
    </div>
  </div>`,
};
