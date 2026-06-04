import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChipInput: Async validation with supersede semantics',
  subtitle: '<code>[validateToken]</code> runs on every separator-key creation. Concurrent validations supersede via a monotonic id; the last one wins. <code>aria-busy</code> reflects pending state and <code>aria-invalid</code> reflects rejection.',
  description: 'Tokenizing input on a native <code>&lt;input&gt;</code>. The directive runs <code>[validateToken]</code> on every separator-key emission and drives an internal <code>CngxStateful</code> validation slot through the <code>idle</code> -&gt; <code>pending</code> -&gt; <code>success | error</code> state machine, with a monotonic <code>validationId</code> so a second submission supersedes the first. Host bindings reflect that slot reactively: <code>aria-busy="true"</code> while a validation is pending, <code>aria-invalid="true"</code> when it rejects. Keyboard: configured separator keys emit <code>(tokenCreated)</code>; <code>Backspace</code> at empty input emits <code>(tokenRemoved)</code> so the consumer can drop the last chip. Paste with embedded single-char separators emits one token per non-empty fragment. The slot is exposed via <code>CNGX_STATEFUL</code>, so bridge directives like <code>&lt;cngx-toast-on /&gt;</code> auto-discover it without an explicit <code>[state]</code> wiring.',
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
    { label: 'WAI-ARIA 1.2: `aria-busy`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-busy' },
    { label: 'WAI-ARIA 1.2: `aria-invalid`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-invalid' },
    { label: 'WCAG 2.1 SC 4.1.3 Status Messages', href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html' },
    { label: 'WCAG 2.1 SC 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
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
  };
  protected readonly validateMinLen = async (value: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (value.length < 3) {
      throw new Error('Tokens must be at least 3 characters.');
    }
    return value.toLowerCase();
  };`,
  template: `
  <div class="chip-strip">
    @for (token of tokens(); track token) {
      <cngx-chip [removable]="true" (remove)="removeToken(token)">{{ token }}</cngx-chip>
    }
    <input
      cngxChipInput
      aria-label="Add a tag"
      placeholder="Min 3 chars; lowercase enforced"
      [existingTokens]="tokens()"
      [validateToken]="validateMinLen"
      (tokenCreated)="addToken($event)"
      (tokenRemoved)="popToken()"
    />
  </div>`,
};
