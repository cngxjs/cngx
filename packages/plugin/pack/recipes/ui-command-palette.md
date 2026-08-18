---
title: "CngxCommandPalette: async results + slots"
whenToUse: "The async [results] path and the five non-row slots. Pick a result state below, then open the palette (Cmd/Ctrl+K or the button) to see that state - a modal dialog blocks the page, so toggle while closed. The row slot is demonstrated separately at /ui/command-palette/custom-row."
symbols: [CngxCommandPalette, CngxCommandGroupHeader, CngxCommandPaletteLoading, CngxCommandPaletteEmpty, CngxCommandPaletteError, CngxCommandPaletteFooter]
---

# CngxCommandPalette: async results + slots

The async [results] path and the five non-row slots. Pick a result state below, then open the palette (Cmd/Ctrl+K or the button) to see that state - a modal dialog blocks the page, so toggle while closed. The row slot is demonstrated separately at /ui/command-palette/custom-row.

## Symbols

- `CngxCommandPalette`
- `CngxCommandGroupHeader`
- `CngxCommandPaletteLoading`
- `CngxCommandPaletteEmpty`
- `CngxCommandPaletteError`
- `CngxCommandPaletteFooter`

## Setup

```ts
protected readonly statusState = signal<AsyncStatus>('success');
  protected readonly dataState = signal<CommandGroup[]>([
    { id: 'recents', label: 'Recents', commands: [{ id: 'reopen', label: 'Reopen closed tab', run: () => {} }] },
  ]);
  protected readonly errorState = signal<unknown>(undefined);
  protected readonly firstLoadState = signal(false);
  // A consumer derives this from term()/scope() + their own HTTP; here we drive it by hand.
  protected readonly results = buildAsyncStateView<CommandGroup[]>({
    status: this.statusState,
    data: this.dataState,
    error: this.errorState,
    isFirstLoad: this.firstLoadState,
  });
```

## Wiring

```html
<button type="button" class="demo-cmdk-trigger" [cngxCommandPaletteTrigger]="palette">
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
  </cngx-command-palette>
```
