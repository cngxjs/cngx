---
title: "CngxSelect: async state consumer"
whenToUse: "[state] drives the panel via CngxAsyncState: loading → skeleton, success → options, empty → empty template, refreshing → top-bar + options, error → retry panel. Replaces [options] while the state has data."
symbols: [CngxSelect]
---

# CngxSelect: async state consumer

[state] drives the panel via CngxAsyncState: loading → skeleton, success → options, empty → empty template, refreshing → top-bar + options, error → retry panel. Replaces [options] while the state has data.

## Symbols

- `CngxSelect`

## Wiring

```
protected readonly loading = signal(true);
  protected readonly asyncOptions: CngxSelectOptionDef<string>[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ];
  protected readonly asyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();
  protected readonly asyncValue = signal<string | undefined>(undefined);
  protected asyncReloads = 0;
  protected readonly asyncReload = (): void => {
    this.asyncReloads += 1;
    this.asyncState.set('loading');
    setTimeout(() => this.asyncState.setSuccess(this.asyncOptions), 600);
  };
```
