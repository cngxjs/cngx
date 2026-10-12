import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'provideCommands: a scoped set inherits the outer set',
  subtitle:
    'The demo component registers the global commands with <code>provideCommands(...)</code> in its <code>viewProviders</code>. A nested editor component adds its own set the same way. Each reads <code>injectCommands()</code> from its own scope: the outer list shows the global commands only, the editor list shows the global commands plus its own.',
  description:
    'A scoped <code>provideCommands</code> call adds to the commands above it and never hides them. The same rule holds for a lazy route: its <code>providers</code> set joins the root set for every page under it. Order is outer scopes first, then inner scopes, each in registration order.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'integration'],
  moduleImports: [
    "import { injectCommands, provideCommands } from '@cngx/common/command';",
    "import { CngxGrid } from '@cngx/ui/layout';",
    "import { EditorCommands } from './_editor-commands.component';",
  ],
  imports: ['CngxGrid', 'EditorCommands'],
  viewProviders: [
    `provideCommands([
      { id: 'new-file', label: 'New file', group: 'File', run: () => {} },
      { id: 'open-file', label: 'Open file', group: 'File', run: () => {} },
      { id: 'settings', label: 'Open settings', group: 'App', run: () => {} },
    ])`,
  ],
  setup: `protected readonly commands = injectCommands();`,
  template: `  <cngx-grid columns="repeat(auto-fit, minmax(14rem, 1fr))">
    <section>
      <h3>Outer scope</h3>
      <ul aria-label="Outer scope commands">
        @for (command of commands(); track command.id) {
          <li>{{ command.label }} <span class="demo-hint demo-hint--small">{{ command.group }}</span></li>
        }
      </ul>
    </section>
    <demo-editor-commands />
  </cngx-grid>`,
  setupChrome: `protected readonly editor = viewChild(EditorCommands);`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Outer scope</span>
      <span class="event-value">{{ commands().length }} commands</span>
    </div>
    <div class="event-row">
      <span class="event-label">Editor scope</span>
      <span class="event-value">{{ editor()?.commands()?.length ?? 0 }} commands (outer + editor)</span>
    </div>
  </div>`,
};
