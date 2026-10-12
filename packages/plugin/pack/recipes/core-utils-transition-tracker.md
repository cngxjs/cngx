---
title: "createTransitionTracker: status transitions"
whenToUse: "Here a computed() maps each edge to a toast: loading -&gt; success shows \"Saved\", any edge into error shows an error toast, and refreshing -&gt; success stays silent because the data was already on screen. The effect only shows what the computed derived, inside untracked(). At mount previous equals current, so no phantom idle -&gt; X edge fires; pass { seed } to treat the mount as a transition. Setting the same status twice is not a transition. Pick a status directly or run a save or refresh, and watch the edge log."
symbols: [CngxToaster]
---

# createTransitionTracker: status transitions

Here a computed() maps each edge to a toast: loading -&gt; success shows "Saved", any edge into error shows an error toast, and refreshing -&gt; success stays silent because the data was already on screen. The effect only shows what the computed derived, inside untracked(). At mount previous equals current, so no phantom idle -&gt; X edge fires; pass { seed } to treat the mount as a transition. Setting the same status twice is not a transition. Pick a status directly or run a save or refresh, and watch the edge log.

## Symbols

- `CngxToaster`

## Setup

```ts
private readonly toaster = inject(CngxToaster);

protected readonly status = signal<AsyncStatus>('idle');
protected readonly transition = createTransitionTracker(() => this.status());

protected readonly toastForEdge = computed<ToastConfig | null>(() => {
  const current = this.transition.current();
  const previous = this.transition.previous();
  if (current === previous) {
    return null;
  }
  if (current === 'error') {
    return { message: 'Saving failed', severity: 'error' };
  }
  if (current === 'success' && previous === 'loading') {
    return { message: 'Saved', severity: 'success' };
  }
  return null;
});

constructor() {
  effect(() => {
    const toast = this.toastForEdge();
    if (toast) {
      untracked(() => this.toaster.show(toast));
    }
  });
}
```

## Wiring

```html
<p>
  Edge: {{ transition.previous() }} -&gt; {{ transition.current() }}
</p>
```
