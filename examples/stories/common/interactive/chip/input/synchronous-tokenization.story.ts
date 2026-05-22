import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Synchronous tokenization',
  subtitle: 'Default separators: comma and Enter. Backspace at empty input removes the last chip. Paste <code>"foo, bar, baz"</code> to emit three tokens at once.',
  description: 'Tokenizing input on a native <code>&lt;input&gt;</code>. Type a value and press Enter (or any configured separator) to emit <code>(tokenCreated)</code>. Backspace at empty input emits <code>(tokenRemoved)</code> — the consumer drops the last chip. Paste with embedded separators emits one token per non-empty fragment. Optional async <code>[validateToken]</code> drives an internal <code>CngxStateful</code> validation slot — bridge directives like <code>&lt;cngx-toast-on /&gt;</code> auto-discover it.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: [
    'CngxChipInput',
    'CNGX_STATEFUL',
  ],
  moduleImports: [
    'import { CngxChipInput } from \'@cngx/common/interactive\';',
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxChipInput', 'CngxChip'],
  setup: `protected readonly tokens = signal<string[]>(['typescript', 'angular']);
  protected readonly addToken = (value: string): void => {
    this.tokens.update((curr) => [...curr, value]);
  };
  protected readonly popToken = (): void => {
    this.tokens.update((curr) => curr.slice(0, -1));
  };
  protected readonly removeToken = (token: string): void => {
    this.tokens.update((curr) => curr.filter((t) => t !== token));
  };`,
  template: `
  <div class="chip-strip">
    @for (token of tokens(); track token) {
      <cngx-chip [removable]="true" (remove)="removeToken(token)">{{ token }}</cngx-chip>
    }
    <input
      cngxChipInput
      placeholder="Type a tag and press Enter"
      [existingTokens]="tokens()"
      (tokenCreated)="addToken($event)"
      (tokenRemoved)="popToken()"
    />
  </div>
  <p class="caption">tokens: <code>{{ tokens().join(', ') || '(none)' }}</code></p>`,
};
