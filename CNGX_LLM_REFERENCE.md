# CNGX — LLM Reference Document (v6)

> **Vollständige Referenz für LLMs im CNGX-Kontext.**
> v6: Library-Restructuring — @cngx/common in 4 Secondary Entry Points (a11y, interactive,
> layout, data), @cngx/ui/material und @cngx/data-display/mat-treetable als eigene Entries,
> @angular/material Peer-Dep aus Primary-Entries entfernt, provideOverlay() statt providedIn,
> provideEnvironment/provideWindow/injectWindow in core/tokens, memoize() statt @Memo().

---

## 1. Was ist CNGX?

**CNGX** = **Composable Angular Extension**

- **Package-Namespace:** `@cngx/*`
- **Selector-Prefix:** `cngx` → Selektoren: `cngx-button`, `[cngxRipple]`, `*cngxIf`

CNGX ist der **fehlende Composition Layer zwischen Angular CDK und Angular Material**.
Es ersetzt weder CDK noch Material — es macht beide **deklarativ und Signal-first**.

```
CDK      — low-level Primitives, kein Styling, imperativ, Observable-API
           ↕  ← CNGX füllt diese Lücke
Material — opinionated Components, schwer composable, imperativ
```

**Was CNGX liefert:**

- CDK-Behaviors als deklarative, composable Directives
- Signal-first APIs dort wo CDK/Material Observables und imperative Patterns nutzt
- Host-Directive-Composition statt monolithischer Component-Konfiguration
- Kein eigenes Styling — Theming bleibt Material, gesteuert über CSS Custom Properties

### Das Problem konkret

```typescript
// ❌ Material/CDK heute: imperativ, schwer composable
export class MyTableComponent implements AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.sort = this.sort; // imperativ verdrahten
    this.sort.sortChange // Observable
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData()); // manuelles Subscribe
  }
}

// ✅ CNGX: deklarativ, Signal-first, Consumer verdrahtet selbst
export class MyTableComponent {
  private readonly items = signal<Patient[]>([]);

  // Consumer baut processed Signal — volle Kontrolle, keine Magie
  readonly processedItems = computed(() => {
    let data = this.items();
    const sort = this.sort().sort();
    if (sort) data = sortItems(data, sort.active, sort.direction);
    return data;
  });

  readonly dataSource = cngxDataSource(this.processedItems);
}
```

```html
<input cngxSearch #search="cngxSearch" />
<mat-table [dataSource]="dataSource" cngxSort #sort="cngxSort">
  <th mat-header-cell>
    <button cngxSortHeader="name" [cngxSortRef]="sort">Name</button>
  </th>
</mat-table>
```

---

## 2. Die 3 Kern-Prinzipien

### 2.1 Deklarativ statt imperativ

Verhalten wird im Template deklariert, nicht im Code verdrahtet.
Components beschreiben _was_ sie brauchen, nicht _wie_ es initialisiert wird.

### 2.2 Signal-first — mit klarer RxJS-Grenze

```
┌─────────────────────────────────────────────┐
│  UI-State / Component-State                 │  → Angular Signals
│  Derived State                              │  → computed()
│  Side Effects                               │  → effect()
├─────────────────────────────────────────────┤
│  API-Grenze                                 │  toSignal() / toObservable()
├─────────────────────────────────────────────┤
│  Externe Events (HTTP, WebSocket, Router)   │  → RxJS
│  CDK/Material interne Streams               │  → RxJS (intern, nicht exponiert)
│  DOM-Event-Streams (fromEvent + debounce)   │  → RxJS, dann toSignal()
└─────────────────────────────────────────────┘
```

- CDK-interne Observables werden intern konsumiert, nach außen als Signals exponiert
- `toSignal()` / `toObservable()` nur an definierten API-Grenzen
- Kein `BehaviorSubject` für lokalen State

### 2.3 Composition via Host Directives

Kein Vererben, kein Copy-Paste. Jeder Verhaltensaspekt ist eine eigenständige Directive
die über `hostDirectives` komponiert wird. Kein ancestor-inject, keine versteckte Magie —
Referenzen werden explizit als `input.required<T>()` übergeben.

---

## 3. Atomic Design — internes Bauprinzip

Atomic Design ist das **interne Architektur-Werkzeug** — es bestimmt wie etwas gebaut wird
und in welche Library es gehört. Kein externer Pitch, keine Erwartung an eigenes Styling.

```
Atoms     = einzelne Directives, ein Verhaltensaspekt, kein CDK/Material
              → @cngx/common
              → Beispiel: [cngxHoverable], [cngxClickOutside], [cngxSort], [cngxFilter]

Molecules = mehrere Atoms kombiniert, CDK-Basis möglich
              → @cngx/common (generisch) oder feature-lib (spezifisch)
              → Beispiel: [cngxSortHeader] (nutzt CngxSortDirective)

Organisms = fertige deklarative Components, Material-Basis
              → @cngx/ui oder @cngx/data-display
              → Beispiel: cngx-treetable, cngx-mat-treetable, cngx-modal-dialog
```

**Entscheidungsregel für neue Teile:**

1. Ein Verhaltensaspekt, kein CDK/Material nötig → Atom → `@cngx/common`
2. Mehrere Atoms kombiniert, CDK möglich → Molecule → `@cngx/common`
3. Nutzt Material-Components als Basis → Organism → `@cngx/ui` oder feature-lib

---

## 4. Library-Struktur

### Dependency-Levels (Sheriff enforced)

```
Level 0:  @cngx/utils         — kein Angular, nur TypeScript
Level 1:  @cngx/core          — Angular, kein CDK, kein Material
Level 2:  @cngx/common        — Angular + CDK (kein Material!)
Level 3:  @cngx/forms         — common + Material Forms
Level 3:  @cngx/data-display  — common + CDK Table (Material nur in mat-treetable Entry)
Level 4:  @cngx/ui            — CDK + common (Material nur in ui/material Entry)
```

**Importregeln (unidirektional, kein Überspringen):**

```
utils        ← nichts
core         ← utils
common       ← core, utils, CDK
forms        ← common, core, utils, Material Forms
data-display ← common, core, utils, CDK Table
ui           ← common, core, utils, CDK, Material (nur in ui/material)
```

### Entry Points (21 total)

```
@cngx/utils                        Pure TS, kein Angular
@cngx/utils/rxjs-interop           RxJS-Bridges

@cngx/core                         VERSION
@cngx/core/tokens                  ENVIRONMENT, WINDOW, provideEnvironment, provideWindow, injectWindow
@cngx/core/utils                   coerceBooleanProperty, coerceNumberProperty, memoize

@cngx/common                       Barrel — re-exportiert alle Secondary Entries + VERSION
@cngx/common/a11y                  CngxFocusTrap, CngxFocusVisible, CngxAriaExpanded, CngxLiveRegion, CngxReducedMotion
@cngx/common/interactive           CngxClickOutside, CngxDisclosure, CngxHoverable, CngxNavLink/Group/Badge/Label,
                                   CngxSearch, CngxSpeak, CngxSwipeDismiss, provideNavConfig, CNGX_NAV_CONFIG
@cngx/common/layout                CngxIntersectionObserver, CngxResizeObserver, CngxScrollLock, CngxBackdrop,
                                   CngxDrawer/DrawerPanel/DrawerContent, CngxMediaQuery
@cngx/common/data                  CngxSort, CngxSortHeader, CngxFilter, CngxPaginate,
                                   injectDataSource, injectSmartDataSource

@cngx/forms                        VERSION
@cngx/forms/controls                CngxTypedControl (signal-based, control ist Signal)
@cngx/forms/validators              patternMatch, requiredTrue

@cngx/ui                           CngxSidenav-Familie, CngxSpeakButton (kein @angular/material Peer!)
@cngx/ui/layout                    CngxStack, CngxGrid
@cngx/ui/overlay                   CngxOverlay, CngxOverlayRef, provideOverlay (nicht providedIn:'root'!)
@cngx/ui/material                  CngxMatPaginator (@angular/material Peer nur hier)

@cngx/data-display                 VERSION
@cngx/data-display/treetable       CngxTreetable (CDK), CngxTreetablePresenter, CngxTreetableRow, Templates, Utils
@cngx/data-display/mat-treetable   CngxMaterialTreetable (@angular/material Peer nur hier)
```

### Filesystem (nach Restructuring)

```
projects/
  utils/      src/, rxjs-interop/
  core/       src/, tokens/, utils/
  forms/      src/, controls/, validators/
  common/     src/ (barrel), a11y/src/, interactive/src/, layout/src/, data/src/
  ui/         src/ (sidenav, speak), layout/, overlay/, material/
  data-display/ src/, treetable/, mat-treetable/
```

Jeder Secondary Entry Point hat: `ng-package.json`, `public-api.ts`, `src/` mit den Quellen.

### Was gehört wohin

**`@cngx/utils`** — Pure Functions, kein Angular, ohne TestBed testbar

- Array-Utils (`coerceArray`), Type Guards
- Tree-Utils: `flattenTree`, `filterTree`, `sortTree`, `nodeMatchesSearch`

**`@cngx/core`** — Angular-Fundament, kein CDK/Material

- Tokens (`ENVIRONMENT`, `WINDOW`), Provider-Funktionen (`provideEnvironment`, `provideWindow`, `injectWindow`)
- Coerce-Utils (`coerceBooleanProperty`, `coerceNumberProperty`), `memoize()` Factory

**`@cngx/common`** — CDK-Behaviors + Data-Behaviors (kein Material)

- `a11y/` — Accessibility-Atoms (FocusTrap nutzt CDK, Rest ist reines Angular)
- `interactive/` — Interaktions-Atoms + Nav-System (kein CDK)
- `layout/` — Layout-Behaviors inkl. Drawer-System (kein CDK)
- `data/` — Sort/Filter/Paginate + DataSource-Varianten (DataSource nutzt CDK)

**`@cngx/forms`** — Material Forms Signal-first

- `controls/` — `CngxTypedControl` (signal-based: `control` ist jetzt ein `Signal`)
- `validators/` — Custom Validators

**`@cngx/data-display`** — Dual-Rendering Components

- `treetable/` — CDK-Rendering: Presenter, CngxTreetable, Row, Templates, Utils
- `mat-treetable/` — Material-Rendering: CngxMaterialTreetable (importiert aus treetable/)

**`@cngx/ui`** — Fertige deklarative Composites

- Primary: Sidenav-System, CngxSpeakButton (kein Material-Peer!)
- `layout/` — CngxStack, CngxGrid
- `overlay/` — CngxOverlay + provideOverlay() (CDK Overlay)
- `material/` — CngxMatPaginator (einziger Entry mit Material-Peer)

---

## 5. Dual-Rendering-Convention

Jede neue `@cngx/data-display` Komponente folgt diesem Muster:

```
[cngxXxxPresenter]     Directive  — aller State, alle Logic
                                    kein Template, kein CDK/Material-Import
                                    wird als hostDirective auf beide Components gesetzt

<cngx-xxx>             Component  — CDK-Rendering, headless, unstyled
                                    importiert nur CDK-Primitives

<cngx-mat-xxx>         Component  — Material-Rendering
                                    identisches Template, mat-* statt cdk-*
                                    importiert Material-Components

mat-xxx-theme.scss                — Material Design Token Overrides
                                    wird im globalen styles.scss eingebunden
```

### SCSS-Konvention für alle Komponenten

Alle Farben und Abstände werden als CSS Custom Properties mit Defaults definiert:

```scss
// CDK-Variante — neutrale Defaults
:host {
  --cngx-table-header-bg: #f9fafb;
  --cngx-table-row-hover-bg: #f0f4ff;
  --cngx-table-row-selected-bg: #e8f0fe;
  --cngx-table-focus-ring: #4f46e5;
  --cngx-table-indent-size: 1.5rem;
}

// Material-Variante — überschreibt mit Material Design Tokens
:host {
  --cngx-table-header-bg: var(--mat-table-background-color, white);
  --cngx-table-row-hover-bg: var(--mat-table-hover-state-layer-color, transparent);
  --cngx-table-focus-ring: var(--mat-focus-indicator-color, currentColor);
}
```

Consumer kann jede Variable auf dem Host-Element überschreiben — kein SCSS-Eingriff nötig.

---

## 6. Naming Conventions (verbindlich)

| Typ                          | Class-Name              | File-Name                  | Selector/Function                      |
| ---------------------------- | ----------------------- | -------------------------- | -------------------------------------- |
| Directive (Attribut)         | `CngxRippleDirective`   | `cngx-ripple.directive.ts` | `[cngxRipple]`                         |
| Directive (Struktur)         | `CngxIfDirective`       | `cngx-if.directive.ts`     | `*cngxIf`                              |
| Component                    | `CngxButton`            | `cngx-button.component.ts` | `cngx-button`                          |
| ng-content Slot              | —                       | —                          | `[cngxModalHeader]`, `[cngxTableCell]` |
| Factory Function (no inject) | —                       | `step-manager.factory.ts`  | `createStepManager()`                  |
| inject() Function            | —                       | `data-source.ts`           | `injectDataSource()`                   |
| Pure Util                    | —                       | `tree.utils.ts`            | `flattenTree()`, `sortTree()`          |
| Service (global)             | `CngxThemeService`      | `cngx-theme.service.ts`    | —                                      |
| Service (feature-scoped)     | `CngxCalendarService`   | `cngx-calendar.service.ts` | —                                      |
| Interface                    | `CngxButtonAPI`         | `cngx-button.api.ts`       | —                                      |
| InjectionToken               | `CNGX_BUTTON_API`       | `cngx-button.tokens.ts`    | Uppercase                              |
| Provider Function            | —                       | `cngx-button.providers.ts` | `provideCngxButtonAPI()`               |
| Adapter                      | `CngxNativeDateAdapter` | `cngx-date.adapter.ts`     | —                                      |
| Test Harness                 | `CngxButtonHarness`     | `cngx-button.harness.ts`   | —                                      |

> **ng-content Slots** immer mit `cngx`-Prefix — verhindert Konflikte mit Konsumenten-Attributen.
> **InjectionToken-Label** Uppercase, z.B. `'CNGX_TREETABLE_CONFIG'`.
> **Barrel Files** nicht verwenden — Module Boundaries via Sheriff enforced.
> **Public API** (`index.ts`) der Library ist kein Barrel File — das ist Standard Angular Library Pattern.

### Member Naming & Visibility

| Konvention | Beispiel |
|-|-|
| Private Members: **kein** `_` Prefix | `private readonly speakingState = signal(false)` (nicht `_speakingState`) |
| Event Handler: `handle` Prefix (nicht `on`) | `handlePointerDown()`, `handleHostClick()` (nicht `onPointerDown`) |
| Template-genutzte interne Members: `protected` | `protected readonly state = inject(...)` |
| Öffentliche API: `readonly` | `readonly active = this.activeState.asReadonly()` |

**Warum kein `_` Prefix:**
TypeScript's `private` Keyword reicht. Underscore-Prefix ist ein Überbleibsel aus JavaScript und
kollidiert mit Angular's Template-Binding-Syntax. Private-naming per `_` ist visuell noisy
und nicht konsistent mit dem Rest des Angular-Ökosystems.

**Warum `handle` statt `on`:**
`on` suggeriert einen Event-Listener (passiv). `handle` macht klar: diese Methode
**verarbeitet** das Event aktiv. Außerdem: `(click)="handleClick()"` liest sich klarer
als `(click)="onClick()"` weil `on` redundant zum `()` Binding ist.

**Warum `protected` für Template-Members:**
Interne Members die nur im eigenen Template genutzt werden sollten `protected` sein —
sie sind nicht Teil der öffentlichen API, aber Angular braucht Zugriff im Template.
`protected` verhindert versehentliche Nutzung durch Consumers via Instanz-Referenz.

### Function naming — vollständige Entscheidungsregel

| Situation                                     | Prefix    | Beispiel                                        |
| --------------------------------------------- | --------- | ----------------------------------------------- |
| Registriert DI-Provider                       | `provide` | `provideTreetable()`, `provideCngxSort()`       |
| Feature-Flag für einen Provider               | `with`    | `withSorting()`                                 |
| Braucht injection context (`inject()` intern) | `inject`  | `injectDataSource()`, `injectSmartDataSource()` |
| Reine Factory, kein inject nötig              | `create`  | `createStepManager()`                           |
| Token-Erstellung                              | `make`    | `makeStateKey()` (Angular intern)               |

**Warum `inject` Prefix:**
`injectDataSource()` ruft `inject(Injector)` intern auf. Die Konvention signalisiert
dem Aufrufer sofort: diese Funktion muss im Injection Context aufgerufen werden —
also im Constructor oder als Field-Initializer, nie in `ngOnInit` oder einem Click-Handler.

```typescript
// ✅ Field-Initializer — im Injection Context
export class MyComponent {
  readonly dataSource = injectDataSource(this.items);
}

// ❌ Zu spät — außerhalb Injection Context
export class MyComponent {
  dataSource!: CngxDataSource<Item>;
  ngOnInit() {
    this.dataSource = injectDataSource(this.items);
  } // Laufzeitfehler
}
```

---

## 7. Kanonisches Directive-Pattern (Atom)

```typescript
@Directive({
  selector: '[cngxRipple]',
  exportAs: 'cngxRipple', // immer exportAs
  standalone: true,
  host: {
    '(pointerdown)': 'handlePointerDown($event)',  // handle, nicht on
    '[style.opacity]': 'rippleStyle().opacity',
  },
})
export class CngxRipple {                          // kein Suffix
  // Signal input() — nicht @Input() Decorator
  readonly color = input<string>('currentColor');
  readonly disabled = input<boolean>(false);

  // Signal output() — nicht EventEmitter
  readonly rippleStart = output<void>();

  // Privater interner State — kein _ Prefix
  private readonly activeState = signal(false);

  // Readonly Public API
  readonly active = this.activeState.asReadonly();

  // Computed für abgeleiteten State
  protected readonly rippleStyle = computed(() => ({
    backgroundColor: this.color(),
    opacity: this.activeState() ? 0.12 : 0,
  }));

  // inject() statt Constructor-Parameter — kein _ Prefix
  private readonly el = inject(ElementRef);

  // effect() im Constructor — NICHT in ngOnInit (NG0203!)
  constructor() {
    effect(() => {
      // Host bindings bevorzugen, effect nur für echte Side-Effects
    });
  }

  // Template-Handler: protected + handle Prefix
  protected handlePointerDown(): void {
    if (this.disabled()) {
      return;
    }
    this.activeState.set(true);
    this.rippleStart.emit();
  }
}
```

---

## 8. Controlled + Uncontrolled Pattern

Alle State-haltenden Directives und Presenter unterstützen beide Modi — konsistent
mit Angular Material's `[(value)]` und dem eigenen `expandedIds` im Treetable-Presenter.

```typescript
// Beispiel: CngxSortDirective
@Directive({ selector: '[cngxSort]', exportAs: 'cngxSort', standalone: true })
export class CngxSortDirective {
  // Controlled inputs
  readonly activeInput = input<string | undefined>(undefined, { alias: 'cngxSortActive' });
  readonly directionInput = input<'asc' | 'desc' | undefined>(undefined, {
    alias: 'cngxSortDirection',
  });

  // Internal state (Uncontrolled)
  private readonly _active = signal<string | undefined>(undefined);
  private readonly _direction = signal<'asc' | 'desc' | undefined>(undefined);

  // Public API — controlled nimmt immer Vorrang
  readonly active = computed(() => this.activeInput() ?? this._active());
  readonly direction = computed(() => this.directionInput() ?? this._direction());
  readonly sort = computed(() =>
    this.active() ? { active: this.active()!, direction: this.direction() ?? 'asc' } : null,
  );

  readonly sortChange = output<{ active: string; direction: 'asc' | 'desc' }>();

  setSort(field: string): void {
    const next: 'asc' | 'desc' =
      field === this._active() && this._direction() === 'asc' ? 'desc' : 'asc';
    this._active.set(field);
    this._direction.set(next);
    this.sortChange.emit({ active: field, direction: next });
  }

  clear(): void {
    this._active.set(undefined);
    this._direction.set(undefined);
  }
}
```

---

## 9. Host Directives — Composition Pattern

```typescript
@Component({
  selector: 'cngx-mat-treetable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxTreetablePresenter,
      inputs: ['tree', 'options', 'expandedIds', 'selectionMode', 'selectedIds', 'trackBy'],
      outputs: ['nodeClicked', 'expandedIdsChange', 'selectionChanged', 'selectedIdsChange'],
    },
  ],
  // ...
})
export class CngxMaterialTreetable<T> {
  // inject() mit { host: true } — nicht @Host() Decorator
  protected readonly state = inject(CngxTreetablePresenter) as CngxTreetablePresenter<T>;
}
```

**Wichtig:** Explizite Input/Output-Mappings immer angeben — auch bei identischen Namen.
Ohne explizites `inputs`-Array werden Inputs nicht durchgereicht.

**Performance-Regel:** Max. 3–4 Host-Directive-Ebenen pro Element.
Bei Listen-Kontexten component-scoped Service statt pro-Item-Instanzen.

---

## 10. Sort / Filter / Search — "Consumer verdrahtet selbst"

Sort, Filter und Search sind **orthogonal zur Treetable und zu allen anderen Components**.
Die Directives kennen die Table nicht, die Table kennt die Directives nicht.
Der Consumer verdrahtet über `computed()`.

```typescript
// Consumer — volle Kontrolle, keine Magie
export class MyComponent {
  private readonly search = viewChild.required(CngxSearchDirective);
  private readonly sort = viewChild.required(CngxSortDirective);
  private readonly rawTree = signal<Node<Patient>[]>([]);

  readonly processedTree = computed(() => {
    let tree = this.rawTree();
    const term = this.search().term();
    const s = this.sort().sort();
    if (term) tree = filterTree(tree, (v) => nodeMatchesSearch(v, term));
    if (s) tree = sortTree(tree, s.active, s.direction);
    return tree;
  });
}
```

```html
<input cngxSearch #search="cngxSearch" placeholder="Suchen..." />

<cngx-treetable [tree]="processedTree()" cngxSort #sort="cngxSort">
  <ng-template [cngxHeader]="'name'">
    <!-- SortHeader mit expliziter Referenz — kein ancestor-inject -->
    <button cngxSortHeader="name" [cngxSortRef]="sort" #h="cngxSortHeader">
      Name @if (h.isActive()) {
      <span>{{ h.isAsc() ? '↑' : '↓' }}</span>
      }
    </button>
  </ng-template>
</cngx-treetable>
```

### CngxSearchDirective — DOM-Event-Bridge

`fromEvent` + `debounceTime` ist hier legitime RxJS-Nutzung: externer DOM-Stream,
nach außen als Signal exponiert.

```typescript
@Directive({ selector: 'input[cngxSearch]', exportAs: 'cngxSearch', standalone: true })
export class CngxSearchDirective {
  readonly debounceMs = input<number>(300);
  private readonly _term = signal('');
  readonly term = this._term.asReadonly();
  readonly hasValue = computed(() => this._term().length > 0);
  readonly searchChange = output<string>();

  constructor() {
    const el = inject(ElementRef<HTMLInputElement>);
    const destroyRef = inject(DestroyRef);

    fromEvent<InputEvent>(el.nativeElement, 'input')
      .pipe(
        map((e) => (e.target as HTMLInputElement).value),
        debounceTime(this.debounceMs()),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((term) => {
        this._term.set(term);
        this.searchChange.emit(term);
      });
  }
}
```

### CngxSortHeader — explizite Referenz, kein ancestor-inject

```typescript
@Directive({
  selector: '[cngxSortHeader]',
  exportAs: 'cngxSortHeader',
  standalone: true,
  host: {
    '(click)': 'onSort()',
    '[attr.aria-sort]': 'ariaSort()',
    '[class.cngx-sort-header--active]': 'isActive()',
    '[class.cngx-sort-header--asc]': 'isAsc()',
    '[class.cngx-sort-header--desc]': 'isDesc()',
  },
})
export class CngxSortHeader {
  readonly field = input.required<string>({ alias: 'cngxSortHeader' });
  readonly cngxSortRef = input.required<CngxSortDirective>(); // explizit, keine Magie

  readonly isActive = computed(() => this.cngxSortRef().active() === this.field());
  readonly isAsc = computed(() => this.isActive() && this.cngxSortRef().direction() === 'asc');
  readonly isDesc = computed(() => this.isActive() && this.cngxSortRef().direction() === 'desc');
  readonly ariaSort = computed((): 'ascending' | 'descending' | null =>
    !this.isActive() ? null : this.isAsc() ? 'ascending' : 'descending',
  );

  protected onSort(): void {
    this.cngxSortRef().setSort(this.field());
  }
}
```

---

## 11. CngxDataSource — beide Varianten

Beide Varianten verwenden den `inject`-Prefix weil sie `inject(Injector)` intern aufrufen
und daher im **Injection Context** aufgerufen werden müssen (Constructor oder Field-Initializer).

### Variante A — Dumb (Signal → CDK-Bridge)

Für den "Consumer verdrahtet selbst"-Ansatz.
Keine Logik — nur CDK-kompatible Observable-Bridge.

```typescript
// @cngx/common/data/data-source.ts
export class CngxDataSource<T> extends DataSource<T> {
  private readonly injector = inject(Injector);

  constructor(private readonly _data: Signal<T[]>) {
    super();
  }

  override connect(): Observable<T[]> {
    return toObservable(this._data, { injector: this.injector });
  }
  override disconnect(): void {}
}

// inject-Prefix: signalisiert Injection-Context-Pflicht
export function injectDataSource<T>(data: Signal<T[]>): CngxDataSource<T> {
  return new CngxDataSource(data);
}
```

Nutzung:

```typescript
export class MyComponent {
  // ✅ Field-Initializer — im Injection Context
  readonly dataSource = injectDataSource(this.processedItems);
  // → funktioniert mit cdk-table, mat-table und cdk-virtual-scroll-viewport
}
```

### Variante B — Smart (integrierte Sort/Filter/Search)

Injiziert die Directives optional — sinnvoll für einfache Listen.
Consumer muss nichts manuell verdrahten.

```typescript
// @cngx/common/data/smart-data-source.ts
export class CngxSmartDataSource<T> extends DataSource<T> {
  private readonly injector = inject(Injector);
  private readonly sort = inject(CngxSortDirective, { optional: true });
  private readonly filter = inject(CngxFilterDirective, { optional: true });
  private readonly search = inject(CngxSearchDirective, { optional: true });

  private readonly _processed: Signal<T[]>;

  constructor(
    data: Signal<T[]>,
    options?: {
      searchFn?: (item: T, term: string) => boolean;
      sortFn?: (a: T, b: T, field: string, dir: 'asc' | 'desc') => number;
    },
  ) {
    super();
    this._processed = computed(() => {
      let items = data();

      const predicate = this.filter?.predicate();
      if (predicate) items = items.filter(predicate as (v: T) => boolean);

      const term = this.search?.term();
      if (term) {
        const fn = options?.searchFn ?? defaultSearchFn;
        items = items.filter((item) => fn(item, term));
      }

      const s = this.sort?.sort();
      if (s) {
        const fn = options?.sortFn ?? defaultSortFn;
        items = [...items].sort((a, b) => fn(a, b, s.active, s.direction));
      }

      return items;
    });
  }

  override connect(): Observable<T[]> {
    return toObservable(this._processed, { injector: this.injector });
  }
  override disconnect(): void {}
}

// inject-Prefix: signalisiert Injection-Context-Pflicht
export function injectSmartDataSource<T>(
  data: Signal<T[]>,
  options?: ConstructorParameters<typeof CngxSmartDataSource<T>>[1],
): CngxSmartDataSource<T> {
  return new CngxSmartDataSource(data, options);
}
```

**Wann welche Variante:**

| Situation                                  | Variante                                           |
| ------------------------------------------ | -------------------------------------------------- |
| Treetable (Tree-Logic im Presenter)        | A — Consumer managed `[tree]` Input                |
| Flache Liste mit eigener Sort/Filter-Logic | A — Consumer baut `computed()`                     |
| Flache Liste, schnell, einfach             | B — SmartDataSource übernimmt alles                |
| Custom Sort/Filter-Algorithmus             | A oder B mit `options.sortFn` / `options.searchFn` |

---

## 12. DI-Pattern

```typescript
// Directives: inject() direkt
export class CngxRippleDirective {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
}

// Factory Functions: kein inject(), kein @Injectable
export function createStepManager(steps: Step[]) {
  const current = signal(0);
  return {
    current: current.asReadonly(),
    next: () => current.update((i) => Math.min(i + 1, steps.length - 1)),
  };
}

// Service feature-scoped: @Injectable() ohne providedIn
@Injectable()
export class CngxCalendarService {
  private readonly _month = signal<Date>(new Date());
  readonly month = this._month.asReadonly();
}
// → providers: [CngxCalendarService] in der Host-Component

// Service app-weit
@Injectable({ providedIn: 'root' })
export class CngxThemeService {}
```

**Entscheidungsregel:**

| Situation                       | Pattern                               |
| ------------------------------- | ------------------------------------- |
| Verhalten in einer Directive    | `inject()`, kein `@Injectable`        |
| Logic scoped zu einer Component | Factory Function `create[Name]()`     |
| Logic geteilt im Component-Tree | `@Injectable()` + `providers: [...]`  |
| App-weiter State                | `@Injectable({ providedIn: 'root' })` |
| Utility / Berechnung            | Pure Function                         |
| Externe Library-Abstraktion     | Adapter via `InjectionToken`          |

---

## 13. Public API Design

```typescript
export interface CngxSortAPI {
  readonly active: Signal<string | undefined>;
  readonly direction: Signal<'asc' | 'desc' | undefined>;
  readonly sort: Signal<{ active: string; direction: 'asc' | 'desc' } | null>;
  setSort(field: string): void;
  clear(): void;
}

export const CNGX_SORT_API = new InjectionToken<CngxSortAPI>('CNGX_SORT_API');

export function provideCngxSort(impl?: Type<CngxSortAPI>): Provider {
  return { provide: CNGX_SORT_API, useClass: impl ?? CngxSortDirective };
}
```

---

## 14. Adapter-Pattern

```typescript
export interface CngxDateAdapter {
  parse(value: unknown, format?: string): Date | null; // unknown, nicht any
  format(date: Date, displayFormat: string): string;
  addDays(date: Date, amount: number): Date;
}

export const CNGX_DATE_ADAPTER = new InjectionToken<CngxDateAdapter>('CNGX_DATE_ADAPTER');

export function provideCngxDateAdapter(impl?: Type<CngxDateAdapter>): Provider {
  return { provide: CNGX_DATE_ADAPTER, useClass: impl ?? CngxNativeDateAdapter };
}
```

---

## 15. Template-Struktur

```typescript
// Slots immer mit cngx-Prefix
@Component({
  selector: 'cngx-modal-dialog',
  template: `
    <ng-content select="[cngxModalHeader]" />
    <ng-content select="[cngxModalBody]" />
    <ng-content select="[cngxModalFooter]" />
  `,
})
export class CngxModalDialog { }

// Deklarativ — kein MatDialog.open()
<cngx-modal-dialog>
  <h2 cngxModalHeader>Titel</h2>
  <div cngxModalBody>Inhalt</div>
  <div cngxModalFooter><cngx-button>OK</cngx-button></div>
</cngx-modal-dialog>
```

---

## 16. Directive-Katalog

**`@cngx/common/a11y`**
`[cngxAriaExpanded]` · `[cngxFocusTrap]` · `[cngxFocusVisible]` · `[cngxLiveRegion]` · `[cngxReducedMotion]`

**`@cngx/common/interactive`**
`[cngxHoverable]` · `input[cngxSearch]` · `[cngxClickOutside]` · `[cngxDisclosure]` ·
`[cngxSpeak]` · `[cngxSwipeDismiss]` · `a[cngxNavLink]` · `[cngxNavGroup]` ·
`[cngxNavLabel]` · `[cngxNavBadge]` · `provideNavConfig()` · `CNGX_NAV_CONFIG`

**`@cngx/common/layout`**
`[cngxResizeObserver]` · `[cngxIntersectionObserver]` · `[cngxScrollLock]` ·
`[cngxBackdrop]` · `[cngxDrawer]` · `[cngxDrawerPanel]` · `[cngxDrawerContent]` · `[cngxMediaQuery]`

**`@cngx/common/data`**
`[cngxSort]` · `[cngxSortHeader]` · `[cngxFilter]` · `[cngxPaginate]` ·
`injectDataSource()` · `injectSmartDataSource()`

**`@cngx/forms/controls`**
`[cngxTypedControl]`

**`@cngx/forms/validators`**
`patternMatch` · `requiredTrue`

**`@cngx/data-display/treetable`**
`cngx-treetable` · `[cngxTreetablePresenter]` · `[cngxTreetableRow]` ·
`[cngxCell]` · `[cngxHeader]` · `[cngxEmpty]` · `provideTreetable()` · `CNGX_TREETABLE_CONFIG`

**`@cngx/data-display/mat-treetable`**
`cngx-mat-treetable`

**`@cngx/ui`**
`cngx-sidenav-layout` · `cngx-sidenav` · `cngx-sidenav-content` · `cngx-speak-button`

**`@cngx/ui/layout`**
`cngx-stack` · `cngx-grid`

**`@cngx/ui/overlay`**
`CngxOverlay` · `CngxOverlayRef` · `provideOverlay()`

**`@cngx/ui/material`**
`cngx-mat-paginator`

---

## 17. Bekannte Stolpersteine

**ST-1: Zirkuläre Abhängigkeiten bei Host Directives**
Tokens in separaten Files. `forwardRef()` bei gegenseitigen Abhängigkeiten.

**ST-2: Performance bei Listen**
Jede Host Directive = neue Instanz. Max. 3–4 Ebenen.
Bei Listen: component-scoped Service im Container, leichte Marker-Directives pro Item.

**ST-3: effect() außerhalb Injection Context**
`effect()` in `ngOnInit` → `NG0203`. Immer im Constructor oder als Field-Initializer.

**ST-4: Host Directive Inputs nicht gemappt**
Ohne explizites `inputs`-Array werden Inputs nicht durchgereicht — auch bei identischen Namen.

**ST-5: CDK-Observable roh exponiert**
CDK-Streams intern konsumieren, nach außen als Signal über `toSignal()` exponieren.

**ST-6: ancestor-inject statt expliziter Referenz**
CNGX verwendet keine ancestor-injection für Directive-zu-Directive-Kommunikation.
Stattdessen: `input.required<CngxSortDirective>()` — sichtbar, explizit, debuggbar.

**ST-7: Imperativer State in Effects**
Kein `let` in `effect()`-Closures. Mutable Closures sind unsichtbar für das Signal-Graph.
Stattdessen: `signal()` für trackbaren State, `effect(onCleanup)` für Cleanup,
`afterNextRender()` + Signal für "skip initial run", lokale `const` im Effect für
Browser-APIs (Observer, MediaQueryList).

**ST-8: Klassen als Datencontainer**
Klassen ohne Verhalten → Interface + Factory Function. Weniger Prototype-Overhead,
besser tree-shakeable. Beispiel: `Version` ist ein Interface, `makeVersion()` erzeugt es.

---

## 18. Vollständiges Regelwerk

### Struktur

- **5.1** Alle Components sind Standalone
- **5.2** Keine Vererbung (Ausnahme: abstract class wenn technisch zwingend)
- **5.3** Verhaltenskombination nur über Host Directives
- **6.1** Jede Directive = ein Verhaltensaspekt (SRP)
- **6.2** Directives immer mit `exportAs`
- **6.3** Directives exponieren State nur über Signals
- **6.4** `input()` / `output()` Signal-API — kein `@Input()`/`@Output()` Decorator

### State

- **8.1** State ausschließlich über Angular Signals
- **8.2** `private signal` intern, `asReadonly()` nach außen
- **8.3** `computed()` für abgeleiteten State
- **8.4** `effect()` nur für Side-Effects, nie für State-Änderungen
- **8.5** CDK-Observables intern konsumieren, als Signals exponieren

### Reaktiv & Funktional

- **R-1** Kein `let` in Effects — stattdessen `signal()` oder `linkedSignal()` verwenden
- **R-2** `effect(onCleanup)` statt `let cleanup` Variable + `DestroyRef.onDestroy()`
- **R-3** "Skip initial run" via `afterNextRender(() => initialized.set(true))` + Signal — kein `let initialized = false`
- **R-4** Host Bindings statt imperativer DOM-Manipulation (`classList.add`, `Renderer2.setAttribute`)
- **R-5** Browser-APIs (Observer, matchMedia) als lokale Variable im `effect()`-Closure — keine mutable Class Fields
- **R-6** `computed()` / `linkedSignal()` statt Effect mit Signal-Write für State-Ableitungen
- **R-7** `Array.map/filter/reduce` statt `for`-Loops mit `push`
- **R-8** Factory Functions (`makeVersion()`, `memoize()`) statt Klassen für reine Daten/Logik
- **R-9** `withXxx()` Feature Functions für `provideXxx()` — composable statt Config-Objekt
- **R-10** `fromEvent()` + `takeUntilDestroyed()` statt `addEventListener` + manuellem `removeEventListener` (Ausnahme: dynamische Listener in Effects → `effect(onCleanup)`)

### API

- **9.1** Public APIs als Interface oder abstrakte Klasse
- **9.2** `InjectionToken`-Label Uppercase, z.B. `'CNGX_TREETABLE_CONFIG'`
- **10.2** ng-content Slots mit `cngx`-Prefix
- **10.4** Fallback-Templates für alle Slots
- **11.1** Verhaltensmuster über Directives oder Factory Functions
- **11.2** Kein `providedIn: 'root'` für Feature-Logic
- **12.1** Events über `output()` — kein `EventEmitter`

### Naming & Visibility

- **N-1** Kein `_` Prefix für private Members — `private readonly activeState` statt `_activeState`
- **N-2** Event Handler: `handle` Prefix — `handlePointerDown()`, `handleHostClick()` (nicht `onPointerDown`)
- **N-3** Template-genutzte interne Members: `protected` — `protected readonly state = inject(...)`
- **N-4** Öffentliche API: `readonly` — `readonly active = this.activeState.asReadonly()`

### Implementierung

- **13.1** Host Directives mit expliziten Input/Output-Mappings — immer, auch bei identischen Namen
- **13.3** `inject(X, { host: true })` — nicht `@Host()` Decorator
- **13.6** Directive-zu-Directive-Referenzen via `input.required<T>()` — kein ancestor-inject
- **15.4** Host Bindings bevorzugen — `Renderer2` nur wenn Host Binding nicht möglich
- **16.1** `effect()` im Constructor oder Field-Initializer — **nicht ngOnInit**
- **16.3** `takeUntilDestroyed()` statt manuelles `takeUntil(destroyed$)`

### Library-Grenzen

- **L-1** Unidirektionale Abhängigkeiten, kein Überspringen von Levels
- **L-2** `@cngx/common` importiert kein Material
- **L-3** Keine Barrel Files intern — Sheriff enforced
- **L-4** Keine zirkulären Library-Abhängigkeiten

### Qualität

- **25.2** Change Detection immer `OnPush`
- **25.3** Granulare Reaktivität durch Signals
- **23.5** Test Harnesses für alle Components

---

## 19. Anti-Patterns

```typescript
// ❌ Vererbung
export class MyTable extends CngxBaseTable { }

// ❌ @Input() / @Output() Decorator
@Input() loading = false;
@Output() clicked = new EventEmitter<void>();

// ❌ effect() in ngOnInit → NG0203
ngOnInit() { effect(() => { ... }); }

// ❌ State in Effect ändern
effect(() => { this._count.set(this.items().length); });

// ❌ Underscore-Prefix für private Members
private readonly _active = signal(false);
// → private readonly activeState = signal(false);

// ❌ "on" Prefix für Event Handler
protected onPointerDown(): void { }
host: { '(click)': 'onClick()' }
// → protected handlePointerDown(): void { }
// → host: { '(click)': 'handleClick()' }

// ❌ Interne Template-Members ohne protected
readonly state = inject(CngxPresenter); // public — Consumer kann zugreifen
// → protected readonly state = inject(CngxPresenter);

// ❌ BehaviorSubject für lokalen State
private _loading$ = new BehaviorSubject(false);

// ❌ @Inject() / @Host() Constructor Decorator (veraltet)
constructor(@Inject(TOKEN) private svc: MySvc) { }
constructor(@Host() public dir: MyDir) { }

// ❌ ancestor-inject für Directive-Kommunikation
private readonly sort = inject(CngxSortDirective); // Welche Instanz?
// → input.required<CngxSortDirective>()

// ❌ providedIn: 'root' für Feature-Logic
@Injectable({ providedIn: 'root' }) export class CalendarService { }

// ❌ CDK-Observable roh exponiert
readonly sortChange = this.matSort.sortChange; // → toSignal()

// ❌ nativeElement direkt manipulieren
this.el.nativeElement.style.color = 'red'; // → Renderer2

// ❌ any statt unknown
parse(value: any): Date | null;

// ❌ ng-content Slot ohne Prefix
<ng-content select="[modal-header]" /> // → [cngxModalHeader]

// ❌ Host Directive ohne explizites Mapping
hostDirectives: [CngxRippleDirective] // inputs nicht durchgereicht!

// ❌ *ngIf / async pipe (Angular 17+ veraltet)
<div *ngIf="loading$ | async"> // → @if (loading()) { }

// ❌ Hardcoded Farben in Component SCSS
background: #f9fafb; // → var(--cngx-table-header-bg, #f9fafb)

// ❌ Mutable let in Effect
let cleanup: (() => void) | undefined;
effect(() => { cleanup?.(); /* ... */ cleanup = () => { }; });
// → effect((onCleanup) => { /* ... */ onCleanup(() => { }); });

// ❌ Plain boolean für "skip initial run"
private _initialized = false;
effect(() => { if (!this._initialized) { this._initialized = true; return; } });
// → private readonly _initialized = signal(false);
//   afterNextRender(() => this._initialized.set(true));
//   effect(() => { if (!this._initialized()) return; ... });

// ❌ Mutable class field für Browser-Observer
private _observer: ResizeObserver | null = null;
effect(() => { this._observer?.disconnect(); this._observer = new ResizeObserver(...); });
// → effect((onCleanup) => { const obs = new ResizeObserver(...); onCleanup(() => obs.disconnect()); });

// ❌ classList.add statt Host Binding
afterNextRender(() => el.classList.add('--ready'));
// → readonly _ready = signal(false);
//   host: { '[class.--ready]': '_ready()' }
//   afterNextRender(() => this._ready.set(true));

// ❌ Klasse für reine Daten
export class Version { constructor(public full: string) { } }
// → export interface Version { full: string; }
//   export function makeVersion(full: string): Version { }

// ❌ Config-Objekt statt Feature Functions
provideTreetable({ highlightRowOnHover: true });
// → provideTreetable(withHighlightOnHover())
```

---

## 20. Kontext

- **Autor:** Principal Frontend Engineer bei SobIT GmbH (Wien), Healthcare-SaaS
- **Test-Codebase:** ngUWI — Angular-Plattform, 500.000+ LOC, 70+ Feature-Modules
- **Stack:** Angular 17+, Angular CDK + Material als Basis, TypeScript strict mode,
  Signals-first, Sheriff für Module Boundaries, Vitest für Tests
- **Zielgruppe:** Teams die CDK/Material nutzen und deklarative, composable Patterns wollen

---

_v6 — März 2026_
