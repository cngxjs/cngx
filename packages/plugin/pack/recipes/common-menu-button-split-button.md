---
title: "CngxSplitButton: Basic"
whenToUse: "The main button runs the default action through cngxAsyncClick; the caret opens the alternatives. The caret needs no [disabled] and no aria-label: inside a split button it renders the caret glyph, is named \"More options\" from the language pack, and follows the main button. While the action runs, the main button shows its busy layer and the caret reads aria-disabled, opens on nothing and closes an open menu. A menu choice runs through the main button, so cngxAsyncClick owns the busy state, aria-busy and the announcement for both entry points. Both parts are separate Tab stops; the group carries role=\"group\" and its own name."
symbols: [CngxSplitButton, CngxIconMenuButton, CngxButton, CngxAsyncClick, CngxMenu, CngxMenuItem, CngxPopover]
---

# CngxSplitButton: Basic

The main button runs the default action through cngxAsyncClick; the caret opens the alternatives. The caret needs no [disabled] and no aria-label: inside a split button it renders the caret glyph, is named "More options" from the language pack, and follows the main button. While the action runs, the main button shows its busy layer and the caret reads aria-disabled, opens on nothing and closes an open menu. A menu choice runs through the main button, so cngxAsyncClick owns the busy state, aria-busy and the announcement for both entry points. Both parts are separate Tab stops; the group carries role="group" and its own name.

## Symbols

- `CngxSplitButton`
- `CngxIconMenuButton`
- `CngxButton`
- `CngxAsyncClick`
- `CngxMenu`
- `CngxMenuItem`
- `CngxPopover`

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
<div cngxSplitButton variant="solid" aria-label="Publish">
  <button cngxButton tone="primary" [cngxAsyncClick]="publish" #run="cngxAsyncClick" #main>Publish</button>
  <button cngxIconMenuButton tone="primary" [menu]="menu" [popover]="pop"></button>
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
