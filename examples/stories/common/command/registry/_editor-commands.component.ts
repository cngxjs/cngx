import { ChangeDetectionStrategy, Component } from '@angular/core';

import { injectCommands, provideCommands } from '@cngx/common/command';

/**
 * Fixture for `scoped-set-inherits-root.story.ts`. An editor view that adds its
 * own command set through `viewProviders` and reads `injectCommands()` from
 * inside that scope, so its list shows the outer set plus its own.
 *
 * Internal demo fixture only - not part of any published bundle.
 */
@Component({
  selector: 'demo-editor-commands',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideCommands([
      { id: 'format', label: 'Format document', group: 'Editor', run: () => {} },
      { id: 'comment', label: 'Toggle comment', group: 'Editor', run: () => {} },
    ]),
  ],
  template: `
    <h3>Editor scope</h3>
    <ul aria-label="Editor scope commands">
      @for (command of commands(); track command.id) {
        <li>{{ command.label }} <span class="demo-hint demo-hint--small">{{ command.group }}</span></li>
      }
    </ul>
  `,
})
export class EditorCommands {
  readonly commands = injectCommands();
}
