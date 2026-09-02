import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCommandPalette: async results + slots',
  subtitle:
    'A consumer-derived CngxAsyncState<CngxCommandGroup[]> drives the shell: skeleton on first load, error (with retry) on a first-load failure, content otherwise. An empty success keeps the search input mounted and renders the empty slot below it. The groupHeader / loading / empty / error / footer slots are all overridden here.',
  description:
    'The async [results] path and the five non-row slots. Pick a result state below, then open the palette (Cmd/Ctrl+K or the button) to see that state - a modal dialog blocks the page, so toggle while closed. The row slot is demonstrated separately at /ui/command-palette/custom-row.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition'],
  references: [
    {
      label: 'WAI-ARIA APG: Dialog (Modal) pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    },
  ],
  apiComponents: [
    'CngxCommandPalette',
    'CngxCommandGroupHeader',
    'CngxCommandPaletteLoading',
    'CngxCommandPaletteEmpty',
    'CngxCommandPaletteError',
    'CngxCommandPaletteFooter',
  ],
  moduleImports: [
    "import { buildAsyncStateView, type AsyncStatus } from '@cngx/core/utils';",
    "import { type CngxCommandGroup } from '@cngx/common/command';",
  ],
  imports: [
    'CngxCommandPalette',
    'CngxCommandPaletteTrigger',
    'CngxCommandGroupHeader',
    'CngxCommandPaletteLoading',
    'CngxCommandPaletteEmpty',
    'CngxCommandPaletteError',
    'CngxCommandPaletteFooter',
  ],
  setup: `protected readonly statusState = signal<AsyncStatus>('success');
  protected readonly dataState = signal<CngxCommandGroup[]>([
    { id: 'recents', label: 'Recents', commands: [{ id: 'reopen', label: 'Reopen closed tab', run: () => {} }] },
  ]);
  protected readonly errorState = signal<unknown>(undefined);
  protected readonly firstLoadState = signal(false);
  // A consumer derives this from term()/scope() + their own HTTP; here we drive it by hand.
  protected readonly results = buildAsyncStateView<CngxCommandGroup[]>({
    status: this.statusState,
    data: this.dataState,
    error: this.errorState,
    isFirstLoad: this.firstLoadState,
  });`,
  setupChrome: `protected setContent(): void {
    this.statusState.set('success');
    this.firstLoadState.set(false);
    this.errorState.set(undefined);
    this.dataState.set([
      { id: 'recents', label: 'Recents', commands: [{ id: 'reopen', label: 'Reopen closed tab', run: () => {} }] },
    ]);
  }
  protected setLoading(): void {
    this.statusState.set('loading');
    this.firstLoadState.set(true);
  }
  protected setEmpty(): void {
    this.statusState.set('success');
    this.firstLoadState.set(false);
    this.dataState.set([]);
  }
  protected setError(): void {
    this.statusState.set('error');
    this.firstLoadState.set(true);
    this.errorState.set(new Error('Network error'));
  }`,
  templateChromeBefore: `<p class="demo-hint">
    Pick a result state, then open the palette with <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd>
    or the button. A modal dialog blocks the page, so switch states while it is closed.
  </p>`,
  template: `  <button type="button" class="demo-cmdk-trigger" [cngxCommandPaletteTrigger]="palette">
    Open commands <kbd>Cmd K</kbd>
  </button>
  <cngx-command-palette
    #palette
    [results]="results"
    (retry)="setContent()"
    ariaLabel="Async command palette"
  >
    <ng-template cngxCommandGroupHeader let-group>
      <strong>{{ group.label }}</strong>
    </ng-template>
    <ng-template cngxCommandPaletteLoading>
      <p role="status">Loading commands...</p>
    </ng-template>
    <ng-template cngxCommandPaletteEmpty let-term="term">
      <p>No commands match "{{ term }}".</p>
    </ng-template>
    <ng-template cngxCommandPaletteError let-retry="retry">
      <p role="alert">
        Could not load commands.
        <button type="button" (click)="retry()">Retry</button>
      </p>
    </ng-template>
    <ng-template cngxCommandPaletteFooter>
      <span>Enter to run &middot; Esc to close</span>
    </ng-template>
  </cngx-command-palette>`,
  templateChrome: `<div class="button-row">
    <button type="button" (click)="setContent()">Content</button>
    <button type="button" (click)="setLoading()">Loading</button>
    <button type="button" (click)="setEmpty()">Empty</button>
    <button type="button" (click)="setError()">Error</button>
  </div>`,
};
