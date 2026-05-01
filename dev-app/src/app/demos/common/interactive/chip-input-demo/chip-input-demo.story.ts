import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Chip input (tokenizing)',
  navLabel: 'Chip input',
  navCategory: 'interactive',
  description:
    'Tokenizing input on a native <code>&lt;input&gt;</code>. Type a value and press Enter ' +
    '(or any configured separator) to emit <code>(tokenCreated)</code>. Backspace at empty ' +
    'input emits <code>(tokenRemoved)</code> — the consumer drops the last chip. Paste ' +
    'with embedded separators emits one token per non-empty fragment. Optional async ' +
    '<code>[validateToken]</code> drives an internal <code>CngxStateful</code> validation ' +
    'slot — bridge directives like <code>&lt;cngx-toast-on /&gt;</code> auto-discover it.',
  apiComponents: ['CngxChipInput', 'CNGX_STATEFUL'],
  moduleImports: [
    "import { CngxChipInput } from '@cngx/common/interactive';",
    "import { CngxChip } from '@cngx/common/display';",
  ],
  setup: `
  protected readonly tokens = signal<string[]>(['typescript', 'angular']);
  protected readonly addToken = (value: string): void => {
    this.tokens.update((curr) => [...curr, value]);
  };
  protected readonly popToken = (): void => {
    this.tokens.update((curr) => curr.slice(0, -1));
  };
  protected readonly removeToken = (token: string): void => {
    this.tokens.update((curr) => curr.filter((t) => t !== token));
  };
  protected readonly validateMinLen = async (value: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (value.length < 3) {
      throw new Error('Tokens must be at least 3 characters.');
    }
    return value.toLowerCase();
  };
  `,
  sections: [
    {
      title: 'Synchronous tokenization',
      subtitle:
        'Default separators: comma and Enter. Backspace at empty input removes the last ' +
        'chip. Paste <code>"foo, bar, baz"</code> to emit three tokens at once.',
      imports: ['CngxChipInput', 'CngxChip'],
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
    },
    {
      title: 'Async validation with supersede semantics',
      subtitle:
        '<code>[validateToken]</code> runs on every separator-key creation. Concurrent ' +
        'validations supersede via a monotonic id — the last one wins. <code>aria-busy</code> ' +
        'reflects pending state; <code>aria-invalid</code> reflects rejection.',
      imports: ['CngxChipInput', 'CngxChip'],
      template: `
  <div class="chip-strip">
    @for (token of tokens(); track token) {
      <cngx-chip [removable]="true" (remove)="removeToken(token)">{{ token }}</cngx-chip>
    }
    <input
      cngxChipInput
      placeholder="Min 3 chars; lowercase enforced"
      [existingTokens]="tokens()"
      [validateToken]="validateMinLen"
      (tokenCreated)="addToken($event)"
      (tokenRemoved)="popToken()"
    />
  </div>`,
    },
  ],
};
