import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'withCommandPaletteTemplates: config templates',
  subtitle:
    '<code>withCommandPaletteTemplates({ row, groupHeader, empty, footer })</code> registers default slot templates in <code>CNGX_COMMAND_PALETTE_CONFIG</code>, so every palette below the provider renders them without projecting a single <code>*cngxCommand*</code> slot. Resolution per slot is instance slot, then this config map, then the built-in default; the unset <code>loading</code> and <code>error</code> slots keep the built-ins.',
  description:
    'Open the palette: rows show a shortcut hint read from <code>command.data</code>, group headers carry a count, the footer is the configured one, and a query that matches nothing renders the configured empty template. <code>TemplateRef</code>s need a live view, so the provider reads them from the host component and the palette renders inside <code>@defer</code>, after the queries resolve; in an app the templates live in a shell component and the palettes in routed content rendered after it.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxCommandPalette', 'CngxCommandPaletteTrigger'],
  moduleImports: [
    "import { forwardRef, TemplateRef } from '@angular/core';",
    "import { provideCommands } from '@cngx/common/command';",
    "import { CNGX_COMMAND_PALETTE_CONFIG, CngxCommandPalette, CngxCommandPaletteTrigger, withCommandPaletteTemplates, type CngxCommandGroupHeaderContext, type CngxCommandPaletteEmptyContext, type CngxCommandPaletteFooterContext, type CngxCommandRowContext } from '@cngx/ui/command-palette';",
  ],
  imports: ['CngxCommandPalette', 'CngxCommandPaletteTrigger'],
  viewProviders: [
    `provideCommands([
      { id: 'new', label: 'New document', keywords: ['create'], group: 'Document', data: { hint: 'Alt N' }, run: () => {} },
      { id: 'duplicate', label: 'Duplicate document', keywords: ['copy'], group: 'Document', data: { hint: 'Alt D' }, run: () => {} },
      { id: 'share', label: 'Share with team', keywords: ['invite'], group: 'Collaboration', data: { hint: 'Alt S' }, run: () => {} },
      { id: 'comments', label: 'Show comments', keywords: ['review'], group: 'Collaboration', data: { hint: 'Alt C' }, run: () => {} },
    ])`,
    `{
      provide: CNGX_COMMAND_PALETTE_CONFIG,
      useFactory: (host: CommandPaletteConfigTemplates) =>
        withCommandPaletteTemplates({
          row: host.rowTpl(),
          groupHeader: host.groupHeaderTpl(),
          empty: host.emptyTpl(),
          footer: host.footerTpl(),
        })(inject(CNGX_COMMAND_PALETTE_CONFIG, { skipSelf: true })),
      deps: [forwardRef(() => CommandPaletteConfigTemplates)],
    }`,
  ],
  setup: `readonly rowTpl = viewChild.required<TemplateRef<CngxCommandRowContext>>('row');
  readonly groupHeaderTpl = viewChild.required<TemplateRef<CngxCommandGroupHeaderContext>>('groupHeader');
  readonly emptyTpl = viewChild.required<TemplateRef<CngxCommandPaletteEmptyContext>>('empty');
  readonly footerTpl = viewChild.required<TemplateRef<CngxCommandPaletteFooterContext>>('footer');
  protected hintOf(data: unknown): string {
    return (data as { hint?: string } | undefined)?.hint ?? '';
  }`,
  templateChromeBefore: `<p class="demo-hint">
    Open with <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> or the button. Type <kbd>zz</kbd> for the empty template.
  </p>`,
  template: `  <ng-template #row let-entry let-data="data">
    <span class="demo-cmd-tpl-row">
      <span>{{ entry.command.label }}</span>
      <kbd class="demo-cmd-tpl-hint">{{ hintOf(data) }}</kbd>
    </span>
  </ng-template>
  <ng-template #groupHeader let-group>
    <span class="demo-cmd-tpl-group">{{ group.label }} ({{ group.commands.length }})</span>
  </ng-template>
  <ng-template #empty let-term="term">
    <p class="demo-cmd-tpl-empty">Nothing found for "{{ term }}". Try a document or team action.</p>
  </ng-template>
  <ng-template #footer>
    <span class="demo-cmd-tpl-footer">Configured footer: Enter runs, Esc closes</span>
  </ng-template>

  @defer (on timer(1ms)) {
    <button type="button" class="demo-cmdk-trigger" [cngxCommandPaletteTrigger]="palette">
      Document actions <kbd>Cmd K</kbd>
    </button>
    <cngx-command-palette #palette ariaLabel="Document actions" />
  }`,
};
