---
title: "CngxTimeline: Loader plus a CngxDataSource"
whenToUse: "The timeline takes the state and nothing else - it never asks where the rows came from. Here they come from an execute() call that a CDK DataSource also wraps, so a cdk-table or a virtual viewport in the same view can consume the identical signal without a second fetch and without the two ever drifting. Load again and the rows stay on screen: the second execute() is no longer a first load, so the body keeps its content instead of dropping back to placeholders."
symbols: [CngxTimeline, CngxDataSource]
---

# CngxTimeline: Loader plus a CngxDataSource

The timeline takes the state and nothing else - it never asks where the rows came from. Here they come from an execute() call that a CDK DataSource also wraps, so a cdk-table or a virtual viewport in the same view can consume the identical signal without a second fetch and without the two ever drifting. Load again and the rows stay on screen: the second execute() is no longer a first load, so the body keeps its content instead of dropping back to placeholders.

## Symbols

- `CngxTimeline`
- `CngxDataSource`

## Wiring

```
protected readonly feed = createAsyncState<{ id: number; at: Date; summary: string }[]>();

  // The rows, once. The timeline reads them through [state]; the DataSource
  // republishes the same computed for a CDK consumer sitting next to it.
  private readonly rows = computed(() => this.feed.data() ?? []);
  private readonly source = injectDataSource(this.rows);
  protected readonly streamed = toSignal(this.source.connect(), {
    initialValue: [] as { id: number; at: Date; summary: string }[],
  });

  protected readonly at = (event: { at: Date }): Date => event.at;
  protected readonly byId = (event: { id: number }): number => event.id;

  protected load(): Promise<void> {
    return this.feed.execute(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(this.nextBatch()), 900);
        }),
    );
  }
```
