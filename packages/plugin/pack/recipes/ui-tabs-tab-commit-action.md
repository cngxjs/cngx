---
title: "CngxTabGroup: optimistic and pessimistic commits with bridge directives"
whenToUse: "Tabs treat [commitAction] as a navigation guard. Optimistic flips the panel immediately and rolls back when the commit does not land; pessimistic blocks until the action resolves. A throw or an erroring observable is a failure: the commit state goes to error and the bridges report it. Answering false is a refusal: the tab rolls back, the tab group announces it, lastOutcome() reads refused and the commit state goes back to idle with its data, so no bridge fires. To toast a refusal, the action shows its own warning toast before it answers false; the visible reason next to the tab group is driven by lastOutcome(). presenter.clearLastFailed() wipes the persistent rejection icon programmatically."
symbols: [CngxTabGroup, CngxTabGroupPresenter, CngxTab, CngxTabContent, CngxToastOn, CngxBannerOn]
---

# CngxTabGroup: optimistic and pessimistic commits with bridge directives

Tabs treat [commitAction] as a navigation guard. Optimistic flips the panel immediately and rolls back when the commit does not land; pessimistic blocks until the action resolves. A throw or an erroring observable is a failure: the commit state goes to error and the bridges report it. Answering false is a refusal: the tab rolls back, the tab group announces it, lastOutcome() reads refused and the commit state goes back to idle with its data, so no bridge fires. To toast a refusal, the action shows its own warning toast before it answers false; the visible reason next to the tab group is driven by lastOutcome(). presenter.clearLastFailed() wipes the persistent rejection icon programmatically.

## Symbols

- `CngxTabGroup`
- `CngxTabGroupPresenter`
- `CngxTab`
- `CngxTabContent`
- `CngxToastOn`
- `CngxBannerOn`

## Setup

```ts
private readonly toaster = inject(CngxToaster);
protected readonly presenter = viewChild(CngxTabGroupPresenter);
protected readonly active = signal(0);
protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
protected readonly outcome = signal<'accept' | 'error' | 'refusal'>('accept');
protected readonly latencyMs = signal(600);
protected readonly refused = computed(() => {
  const presenter = this.presenter();
  return presenter?.lastFailedIndex() !== undefined && presenter?.lastOutcome()?.kind === 'refused';
});
protected readonly commitAction: CngxTabsCommitAction = (from, to) => {
  const ms = this.latencyMs();
  const outcome = this.outcome();
  return new Observable<boolean>((sub) => {
    const handle = setTimeout(() => {
      if (outcome === 'error') {
        sub.error(new Error('Could not save tab ' + from + ' -> ' + to));
        return;
      }
      if (outcome === 'refusal') {
        // A refusal is the action's own decision: it toasts its reason
        // itself, then answers false. The bridges stay silent.
        this.toaster.show({ message: 'Save the profile first.', severity: 'warning' });
        sub.next(false);
        sub.complete();
        return;
      }
      sub.next(true);
      sub.complete();
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
  [toastSuccess]="'Tab saved'"
  [toastError]="'Tab transition failed'"
  cngxBannerOn
  bannerId="tabs:commit-error"
  [bannerError]="'The server could not switch the tab.'"
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
@if (refused()) {
  <p>Not allowed yet: save the profile first.</p>
}
```
