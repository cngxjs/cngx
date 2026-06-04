import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChipInput: Synchronous tokenization',
  subtitle: 'Default separators: comma and Enter. Backspace at empty input removes the last chip. Paste <code>"foo, bar, baz"</code> to emit three tokens at once.',
  description: 'Tokenizing input on a native <code>&lt;input&gt;</code>. The directive handles <code>keydown</code> on configured separators (default <code>,</code> + <code>Enter</code>) and emits <code>(tokenCreated)</code>; <code>Backspace</code> at empty input emits <code>(tokenRemoved)</code> so the consumer can drop the last chip. Paste with embedded separators emits one token per non-empty fragment. No validation is wired here, so <code>aria-busy</code> / <code>aria-invalid</code> stay idle; see the async-validation example for the full <code>CngxStateful</code> slot.',
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
  references: [
    { label: 'WCAG 2.1 SC 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
    { label: 'WCAG 2.1 SC 4.1.2 Name, Role, Value', href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html' },
  ],
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
      aria-label="Add a tag"
      placeholder="Type a tag and press Enter"
      [existingTokens]="tokens()"
      (tokenCreated)="addToken($event)"
      (tokenRemoved)="popToken()"
    />
  </div>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">tokens</span>
      <span class="event-value">{{ tokens().join(', ') || '(none)' }}</span>
    </div>
  </div>`,
};
