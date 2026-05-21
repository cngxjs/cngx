# Tabs Scroll Sync

Installs an effect that keeps the active tab visible inside a horizontally-scrolling tablist. Tracks the `activeId` signal and calls `scrollIntoView` on the matching `[id="<itemId>-header"]` element. The DOM call sits inside `untracked()` so only the id is reactive. Strip-agnostic: the same factory powers `<cngx-tab-group>` and `<cngx-stepper>`.

## Import

```ts
import {
  CNGX_ORGANISM_SCROLL_SYNC_FACTORY,
  createOrganismScrollSync,
  type CngxOrganismScrollSyncOptions,
} from '@cngx/common/tabs';
```

## Quick start

Inside an organism that owns a horizontal tablist:

```ts
import { Directive, ElementRef, inject, Injector } from '@angular/core';
import { CNGX_ORGANISM_SCROLL_SYNC_FACTORY } from '@cngx/common/tabs';

@Directive({ selector: '[appTabStrip]' })
export class AppTabStrip {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly injector = inject(Injector);
  private readonly scrollSync = inject(CNGX_ORGANISM_SCROLL_SYNC_FACTORY);

  // activeId comes from the presenter; each header carries id="<itemId>-header"
  constructor() {
    this.scrollSync({
      activeId: this.presenter.activeId,
      hostElement: this.host,
      injector: this.injector,
    });
  }
}
```

Override the scroll behaviour per call site, or globally via the DI token (instant scroll, `prefers-reduced-motion` opt-out, telemetry):

```ts
import { CNGX_ORGANISM_SCROLL_SYNC_FACTORY, createOrganismScrollSync } from '@cngx/common/tabs';

providers: [
  {
    provide: CNGX_ORGANISM_SCROLL_SYNC_FACTORY,
    useValue: (opts) => {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      createOrganismScrollSync({
        ...opts,
        scrollOptions: { behavior: reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' },
      });
    },
  },
],
```

The default `scrollOptions` are `{ behavior: 'smooth', block: 'nearest', inline: 'center' }`. `scrollIntoView` is optional-chained for jsdom.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the factory signature and token.
- `@cngx/common/tabs/overflow` for the collapse-into-more-button surface.
- `@cngx/common/tabs` entry for the presenter, host tokens, and config cascade.
