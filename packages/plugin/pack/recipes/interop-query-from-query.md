---
title: "fromQuery: TanStack query bridge"
whenToUse: "The query is a genuine TanStack Angular Query - provideTanStackQuery(new QueryClient()) is component-scoped via viewProviders, no app-level setup. fromQuery is pure computed(): first load reads loading, a refetch over retained data reads refreshing, and a failed refetch keeps the rows on screen while status flips to error. The demo sets retry: false so the error path is immediate; TanStack's default is three retries with backoff. The readout shows the raw TanStack pair next to the mapped cngx status."
symbols: [CngxAsyncContainer]
---

# fromQuery: TanStack query bridge

The query is a genuine TanStack Angular Query - provideTanStackQuery(new QueryClient()) is component-scoped via viewProviders, no app-level setup. fromQuery is pure computed(): first load reads loading, a refetch over retained data reads refreshing, and a failed refetch keeps the rows on screen while status flips to error. The demo sets retry: false so the error path is immediate; TanStack's default is three retries with backoff. The readout shows the raw TanStack pair next to the mapped cngx status.

## Symbols

- `CngxAsyncContainer`

## Setup

```ts
protected readonly failNext = signal(false);

  protected readonly query = injectQuery(() => ({
    queryKey: ['people'],
    queryFn: () => this.fetchPeople(),
    retry: false,
  }));

  protected readonly people = fromQuery<Person[]>(this.query);

  private fetchPeople(): Promise<Person[]> {
    const fail = this.failNext();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (fail) {
          reject(new Error('People endpoint unavailable'));
          return;
        }
        resolve(PEOPLE.slice(0, 5));
      }, 900);
    });
  }
```

## Wiring

```html
<cngx-async-container [state]="people" ariaLabel="People">
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
