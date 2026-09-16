---
title: "withCngxAsyncState: SignalStore async feature"
whenToUse: "The feature contributes one createManualState per key via withProps - no hand-written isLoading flags, no new state machine. The &lt;T&gt;() / (key) currying keeps the key literal, so the members are concretely named. The demo instantiates the store inline for a self-contained example; an application registers the store class in providers and injects it. Check the fail flag to route the same stream through setError and watch the error surface take over."
symbols: [CngxAsyncContainer]
---

# withCngxAsyncState: SignalStore async feature

The feature contributes one createManualState per key via withProps - no hand-written isLoading flags, no new state machine. The &lt;T&gt;() / (key) currying keeps the key literal, so the members are concretely named. The demo instantiates the store inline for a self-contained example; an application registers the store class in providers and injects it. Check the fail flag to route the same stream through setError and watch the error surface take over.

## Symbols

- `CngxAsyncContainer`

## Setup

```ts
private readonly UsersStore = signalStore(
    withCngxAsyncState<Person[]>()('users'),
    withMethods((store) => ({
      load: (fail: boolean) =>
        timer(900)
          .pipe(
            map(() => {
              if (fail) {
                throw new Error('Users endpoint unavailable');
              }
              return PEOPLE.slice(0, 5);
            }),
            tapAsyncState(store.usersSink),
          )
          .subscribe(),
    })),
  );

  protected readonly store = new this.UsersStore();

  constructor() {
    this.store.load(false);
  }
```

## Wiring

```html
<cngx-async-container [state]="store.usersState" ariaLabel="Users">
    <ng-template cngxAsyncSkeleton>
      <div class="demo-stack--tight" style="display:flex;flex-direction:column">
        @for (i of [1, 2, 3]; track i) {
          <div class="demo-skeleton-bar" style="height:24px"></div>
        }
      </div>
    </ng-template>

    <ng-template cngxAsyncContent let-data>
      <ul style="list-style:none;padding:0;margin:0">
        @for (person of data; track person.name) {
          <li>{{ person.name }} ({{ person.role }})</li>
        }
      </ul>
    </ng-template>

    <ng-template cngxAsyncError let-err>
      <p style="margin:0">Load failed: {{ $any(err).message }}</p>
    </ng-template>
  </cngx-async-container>
```
