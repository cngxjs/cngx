---
title: "Latency-selected indicator: spinner vs skeleton from observed duration"
whenToUse: "The probe measures the registry busy-envelope (first start to last end). The next load's treatment is chosen from the previously observed duration: waits above the cutoff render a skeleton, shorter ones a spinner. Busy state and the chosen kind are announced to assistive technology via aria-busy and a polite live region."
symbols: [CngxAsyncRegistry]
---

# Latency-selected indicator: spinner vs skeleton from observed duration

The probe measures the registry busy-envelope (first start to last end). The next load's treatment is chosen from the previously observed duration: waits above the cutoff render a skeleton, shorter ones a spinner. Busy state and the chosen kind are announced to assistive technology via aria-busy and a polite live region.

## Symbols

- `CngxAsyncRegistry`

## Wiring

```
private readonly config = injectLoadingConfig();
  protected readonly cutoff = this.config.spinnerVsSkeletonCutoff;

  protected readonly probe = injectLatencyProbe();

  // Live prediction for the NEXT load: a slow last envelope predicts a skeleton,
  // a fast one a spinner. Drives the readout, not the visible indicator.
  protected readonly nextIsSkeleton = computed(() => {
    const last = this.probe.lastDuration();
    return last !== undefined && last > this.cutoff;
  });

  // Flash gate: only surface the indicator once busy persists past showDelay,
  // and keep it up for minDwell so it never flickers out.
  protected readonly gatedBusy = createVisibilityGate(
    computed(() => this.probe.isBusy()),
    signal(this.config.showDelay),
    signal(this.config.minDwell),
  );

  // Latch the treatment when the indicator appears and hold it until it hides.
  // lastDuration updates at the envelope's end, but the gate keeps the indicator
  // on screen through its dwell tail; reading the prediction untracked at the
  // rising edge stops the kind from swapping mid-display.
  protected readonly displayedKind = linkedSignal<boolean, 'spinner' | 'skeleton'>({
    source: () => this.gatedBusy(),
    computation: (visible, prev) => {
      if (!visible) {
        return prev?.value ?? 'spinner';
      }
      return untracked(() => this.nextIsSkeleton()) ? 'skeleton' : 'spinner';
    },
  });

  protected readonly announcement = computed(() => {
    if (!this.gatedBusy()) {
      return '';
    }
    return this.displayedKind() === 'skeleton' ? 'Preparing content' : 'Loading';
  });
```
