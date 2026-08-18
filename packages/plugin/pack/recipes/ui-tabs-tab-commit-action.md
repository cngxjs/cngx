---
title: "CngxTabGroup: optimistic and pessimistic commits with bridge directives"
whenToUse: "Tabs treat [commitAction] as a navigation guard. Optimistic flips the panel immediately and rolls back on rejection; pessimistic blocks until the action resolves. Toast and banner bridges compose by DI; presenter.clearLastFailed() wipes the persistent rejection icon programmatically."
symbols: [CngxTabGroup, CngxTabGroupPresenter, CngxTab, CngxTabContent, CngxToastOn, CngxBannerOn]
---

# CngxTabGroup: optimistic and pessimistic commits with bridge directives

Tabs treat [commitAction] as a navigation guard. Optimistic flips the panel immediately and rolls back on rejection; pessimistic blocks until the action resolves. Toast and banner bridges compose by DI; presenter.clearLastFailed() wipes the persistent rejection icon programmatically.

## Symbols

- `CngxTabGroup`
- `CngxTabGroupPresenter`
- `CngxTab`
- `CngxTabContent`
- `CngxToastOn`
- `CngxBannerOn`

## Setup

```ts
protected readonly active = signal(0);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly shouldFail = signal(false);
  protected readonly latencyMs = signal(600);
  protected readonly commitAction: CngxTabsCommitAction = (from, to) => {
    const ms = this.latencyMs();
    const fail = this.shouldFail();
    return new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        if (fail) {
          sub.error(new Error('Server refused tab ' + from + ' -> ' + to));
        } else {
          sub.next(true);
          sub.complete();
        }
      }, ms);
      return () => clearTimeout(handle);
    });
  };
```

## Wiring

```html
<cngx-tab-group
    #tg="cngxTabGroup"
    [(activeIndex)]="active"
    [commitAction]="commitAction"
    [commitMode]="mode()"
    cngxToastOn
    [toastError]="'Tab transition failed'"
    cngxBannerOn
    bannerId="tabs:commit-error"
    [bannerError]="'Tab transition refused by the server.'"
    aria-label="Async tab navigation"
  >
    <div cngxTab [label]="'Profile'">
      <ng-template cngxTabContent><p>Profile content.</p></ng-template>
    </div>
    <div cngxTab [label]="'Account'">
      <ng-template cngxTabContent><p>Account content.</p></ng-template>
    </div>
    <div cngxTab [label]="'Notifications'">
      <ng-template cngxTabContent><p>Notification preferences.</p></ng-template>
    </div>
  </cngx-tab-group>
```
