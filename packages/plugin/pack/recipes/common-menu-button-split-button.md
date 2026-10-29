---
title: "CngxSplitButton: Basic"
whenToUse: "The main button runs the default action through cngxAsyncClick; the caret opens the alternatives. The caret needs no [disabled] and no aria-label: inside a split button it renders the caret glyph, is named \"More options\" from the language pack, and follows the main button. While the action runs, the main button shows its busy layer and the caret reads aria-disabled, opens on nothing and closes an open menu. A menu choice runs immediately, through the main button, so cngxAsyncClick owns the busy state, aria-busy and the announcement for both entry points. The settle announcement names the action that ran (\"Saved as draft\", not a generic \"Action succeeded\"). Both parts are separate Tab stops; the group carries role=\"group\" and its own name."
symbols: [CngxSplitButton, CngxIconMenuButton, CngxButton, CngxAsyncClick, CngxMenu, CngxMenuItem, CngxPopover]
---

# CngxSplitButton: Basic

The main button runs the default action through cngxAsyncClick; the caret opens the alternatives. The caret needs no [disabled] and no aria-label: inside a split button it renders the caret glyph, is named "More options" from the language pack, and follows the main button. While the action runs, the main button shows its busy layer and the caret reads aria-disabled, opens on nothing and closes an open menu. A menu choice runs immediately, through the main button, so cngxAsyncClick owns the busy state, aria-busy and the announcement for both entry points. The settle announcement names the action that ran ("Saved as draft", not a generic "Action succeeded"). Both parts are separate Tab stops; the group carries role="group" and its own name.

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
// Copy per action: the settle announcement names the action that ran,
// whichever entry point started it.
protected readonly copy: Record<string, { done: string; failed: string }> = {
  now: { done: 'Published', failed: 'Publishing failed' },
  draft: { done: 'Saved as draft', failed: 'Saving the draft failed' },
  scheduled: { done: 'Scheduled for tomorrow', failed: 'Scheduling failed' },
  team: { done: 'Published to team', failed: 'Publishing to team failed' },
};

private readonly nextMode = signal('now');
protected readonly running = signal('now');
protected readonly lastRun = signal<string | null>(null);

protected readonly publish = (): Promise<void> => {
  this.running.set(this.nextMode());
  this.nextMode.set('now');
  return new Promise((resolve) =>
    setTimeout(() => {
      this.lastRun.set(this.running());
      resolve();
    }, 1500),
  );
};

private readonly main = viewChild.required('main', { read: ElementRef });

// A menu choice runs through the main button, so cngxAsyncClick owns the
// busy state, aria-busy and the announcement for both entry points.
protected handleChoice(choice: string): void {
  this.nextMode.set(choice);
  (this.main().nativeElement as HTMLButtonElement).click();
}
```

## Wiring

```html
<div cngxSplitButton variant="solid" aria-label="Publish">
  <button
    cngxButton
    tone="primary"
    [cngxAsyncClick]="publish"
    [succeededAnnouncement]="copy[running()].done"
    [failedAnnouncement]="copy[running()].failed"
    #run="cngxAsyncClick"
    #main
  >
    Publish
  </button>
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
