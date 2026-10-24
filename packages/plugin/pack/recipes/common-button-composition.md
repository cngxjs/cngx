---
title: "Composition: Split button"
whenToUse: "A split button is a group of two buttons, not a new class. The main button runs the default action through cngxAsyncClick; the caret is an icon button with its own aria-label that opens a menu through cngxMenuTrigger and cngxPopoverTrigger. Both parts are separate Tab stops. The busy state is shared: a menu choice runs through the same action, and while it is pending the main button shows its busy layer and both parts refuse activation. Solid primary segments get a seam line so the two parts stay readable."
symbols: [CngxButtonGroup, CngxButton, CngxIconButton, CngxIcon, CngxAsyncClick, CngxMenuTrigger, CngxMenu, CngxMenuItem, CngxPopoverTrigger]
---

# Composition: Split button

A split button is a group of two buttons, not a new class. The main button runs the default action through cngxAsyncClick; the caret is an icon button with its own aria-label that opens a menu through cngxMenuTrigger and cngxPopoverTrigger. Both parts are separate Tab stops. The busy state is shared: a menu choice runs through the same action, and while it is pending the main button shows its busy layer and both parts refuse activation. Solid primary segments get a seam line so the two parts stay readable.

## Symbols

- `CngxButtonGroup`
- `CngxButton`
- `CngxIconButton`
- `CngxIcon`
- `CngxAsyncClick`
- `CngxMenuTrigger`
- `CngxMenu`
- `CngxMenuItem`
- `CngxPopoverTrigger`

## Setup

```ts
protected readonly mode = signal('now');
protected readonly lastRun = signal<string | null>(null);

protected readonly publish = (): Promise<void> =>
  new Promise((resolve) =>
    setTimeout(() => {
      this.lastRun.set(this.mode());
      this.mode.set('now');
      resolve();
    }, 1500),
  );

private readonly main = viewChild.required('main', { read: ElementRef });

// A menu choice runs through the main button, so cngxAsyncClick owns the
// busy state, aria-busy and the announcement for both entry points.
protected handleChoice(choice: string): void {
  this.mode.set(choice);
  (this.main().nativeElement as HTMLButtonElement).click();
}
```

## Wiring

```html
<div cngxButtonGroup variant="solid" aria-label="Publish">
  <button cngxButton tone="primary" [cngxAsyncClick]="publish" #run="cngxAsyncClick" #main>Publish</button>
  <button
    cngxIconButton
    tone="primary"
    aria-label="More publish options"
    [disabled]="run.pending()"
    [cngxMenuTrigger]="menu"
    [cngxPopoverTrigger]="pop"
    [haspopup]="'menu'"
    [popover]="pop"
    (click)="pop.toggle()"
  >
    <cngx-icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    </cngx-icon>
  </button>
</div>
<div cngxPopover placement="bottom-end" #pop="cngxPopover">
  <ul
    cngxMenu
    [label]="'Publish options'"
    tabindex="0"
    (itemActivated)="handleChoice($any($event))"
    #menu="cngxMenu"
  >
    <li cngxMenuItem value="draft">Save as draft</li>
    <li cngxMenuItem value="scheduled">Schedule for tomorrow</li>
    <li cngxMenuItem value="team">Publish to team only</li>
  </ul>
</div>
```
