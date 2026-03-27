# CngxCard — Architektur

## Was eine Card sein muss

Die meisten Card-Implementierungen sind `<div>` mit `box-shadow`. Das ist kein UX — das ist Dekoration.
Eine Card beantwortet eine Frage: **Was ist die primäre Aktion dieser Card, und wie kommuniziert sie das?**

Material `mat-card` beantwortet diese Frage nicht. Es rendert immer ein `<div>`, kennt keinen Loading-State,
kein Selection-Model, kein Touch-Handling, keine SR-Announcements. Die DX: 16 Exports, hidden Wrapper-DIVs,
hardcoded 2000+ Zeichen inline CSS. Action Cards brauchen Wrapper-Hacks. Eine `mat-card` die klickbar sein
soll kommuniziert das weder semantisch noch an Assistive Technologies.

CngxCard macht das anders.

---

## Die drei Card-Archetypen

Die semantische Entscheidung kommt vor jeder Architektur:

**Display Card** — zeigt Information, keine primäre Aktion
→ Host-Element bekommt `role="article"`

**Action Card** — die gesamte Card ist klickbar
→ Host-Element bekommt `role="link"` oder `role="button"`, `tabindex="0"`

**Interactive Card** — Card hat mehrere unabhängige Aktionen
→ Host-Element bekommt `role="article"`, interne `<button>`/`<a>` tragen die Interaktion

Das ist keine Styling-Entscheidung — das ist die semantische Architektur. Ein Screen Reader der über drei
Action Cards navigiert und "div div div" hört ist eine A11y-Katastrophe. Ein Screen Reader der
"Patientenkarte: Maria Muster, Zimmer 12 — Link" hört versteht sofort was passiert.

---

## CngxCard — das Atom

Das Host-Element selbst trägt die Semantik. Kein innerer Wrapper, kein `<a>` innerhalb eines Custom Elements.
Die Card **ist** der Button / Link / Article — nicht ein Container der einen enthält.

```typescript
@Component({
  selector: 'cngx-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cngx-card',
    '[attr.role]': 'hostRole()',
    '[attr.tabindex]': 'interactive() ? 0 : null',
    '[attr.href]': 'as() === "link" ? href() : null',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-selected]': 'selectable() ? selected() : null',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-describedby]': 'describedByIds()',
    '[class.cngx-card--interactive]': 'interactive()',
    '[class.cngx-card--selected]': 'selected()',
    '[class.cngx-card--loading]': 'loading()',
    '[class.cngx-card--disabled]': 'disabled()',
    '(click)': 'handleHostClick($event)',
    '(keydown.enter)': 'handleHostKeydown($event)',
    '(keydown.space)': 'handleHostKeydown($event)',
  },
  template: `
    <ng-content select="[cngxCardMedia]" />
    <ng-content select="[cngxCardHeader]" />
    <ng-content select="[cngxCardBody]" />
    <ng-content select="[cngxCardFooter]" />
    <ng-content select="[cngxCardActions]" />
    <ng-content />

    <!-- Disabled-Reason: immer im DOM, aria-hidden steuert Sichtbarkeit -->
    <span
      [id]="disabledReasonId"
      [attr.aria-hidden]="!disabled() || !disabledReason()"
      class="cngx-sr-only"
    >
      {{ disabledReason() }}
    </span>

    <!-- SR-Live-Region: immer im DOM, Content wechselt reaktiv -->
    <span [id]="liveRegionId" aria-live="polite" aria-atomic="true" class="cngx-sr-only">
      {{ liveAnnouncement() }}
    </span>
  `,
})
export class CngxCard {
  private readonly elementId = inject(UniqueIdService).next('cngx-card');

  // --- Archetype ---
  readonly as = input<'article' | 'link' | 'button'>('article');
  readonly href = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);

  // --- State ---
  readonly selected = model<boolean>(false);
  readonly selectable = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly disabledReason = input<string | undefined>(undefined);

  // --- Derived ---
  readonly interactive = computed(() => this.as() !== 'article');

  protected readonly hostRole = computed(() => {
    switch (this.as()) {
      case 'button':
        return 'button';
      case 'link':
        return 'link';
      default:
        return 'article';
    }
  });

  protected readonly disabledReasonId = `${this.elementId}-disabled-reason`;
  protected readonly liveRegionId = `${this.elementId}-live`;

  // IDs immer vorhanden — aria-hidden steuert was SR liest
  protected readonly describedByIds = computed(() => {
    const ids: string[] = [];
    if (this.disabled() && this.disabledReason()) {
      ids.push(this.disabledReasonId);
    }
    return ids.length ? ids.join(' ') : null;
  });

  // SR announcement bei State-Änderungen
  protected readonly liveAnnouncement = computed(() => {
    if (this.loading()) return $localize`:@@cngx.card.loading:Loading`;
    if (this.selected()) return $localize`:@@cngx.card.selected:Selected`;
    return '';
  });

  // --- Events ---
  readonly clicked = output<void>();

  protected handleHostClick(e: MouseEvent): void {
    if (!this.interactive()) return;
    if (this.disabled()) {
      e.preventDefault();
      return;
    }
    if (this.selectable()) this.selected.update((v) => !v);
    this.clicked.emit();
  }

  protected handleHostKeydown(e: KeyboardEvent): void {
    if (!this.interactive()) return;
    if (this.disabled()) {
      e.preventDefault();
      return;
    }
    // Space: prevent scroll
    if (e.key === ' ') e.preventDefault();
    if (this.selectable()) this.selected.update((v) => !v);
    this.clicked.emit();
  }
}
```

### Warum kein innerer `<a>` / `<button>`?

- Kein doppelter Fokusring (Host + inneres Element)
- Kein Wrapper-Problem für SR ("generic > button" wird zu "button")
- Die gesamte Card-Fläche ist das Touch-Target — kein 44px-Button in einer 200px-Card
- `href` als Host-Attribut: der Browser zeigt die URL in der Statusbar bei Hover

### Warum `$localize` statt hardcodierter Strings?

SR-Announcements müssen in der Sprache des Users sein. `$localize` integriert mit Angulars i18n-Pipeline.
Hardcodierte deutsche Strings in einer Library sind ein A11y-Bug.

---

## Slot-Direktiven

Jeder Slot ist semantisch korrekt — kein `<div>` ohne Bedeutung:

```typescript
@Directive({
  selector: '[cngxCardHeader]',
  standalone: true,
  host: { class: 'cngx-card__header' },
})
export class CngxCardHeader {}

@Directive({
  selector: '[cngxCardBody]',
  standalone: true,
  host: { class: 'cngx-card__body' },
})
export class CngxCardBody {}

@Directive({
  selector: '[cngxCardMedia]',
  standalone: true,
  host: {
    class: 'cngx-card__media',
    '[style.aspect-ratio]': 'aspectRatio() !== "auto" ? aspectRatio() : null',
    '[attr.aria-hidden]': 'decorative()',
  },
})
export class CngxCardMedia {
  readonly decorative = input<boolean>(true);
  readonly aspectRatio = input<'16/9' | '4/3' | '1/1' | 'auto'>('auto');
}

@Directive({
  selector: '[cngxCardFooter]',
  standalone: true,
  host: { class: 'cngx-card__footer' },
})
export class CngxCardFooter {}

@Directive({
  selector: '[cngxCardActions]',
  standalone: true,
  host: {
    class: 'cngx-card__actions',
    '[class.cngx-card__actions--end]': 'align() === "end"',
  },
})
export class CngxCardActions {
  readonly align = input<'start' | 'end'>('start');
}
```

---

## CngxCardGrid — das Layout-Atom

Cards ohne ein durchdachtes Grid-Layout sind wertlos.

```typescript
@Component({
  selector: 'cngx-card-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: CngxRovingTabindex, inputs: ['cngxRovingTabindex'] }],
  host: {
    class: 'cngx-card-grid',
    '[attr.role]': 'semanticList() ? "list" : null',
    '[style.--cngx-card-grid-min]': 'minWidth()',
    '[style.--cngx-card-grid-gap]': 'gap()',
    '[class.cngx-card-grid--compact]': 'density() === "compact"',
    '[class.cngx-card-grid--comfortable]': 'density() === "comfortable"',
  },
  template: `
    @if (!empty()) {
      <ng-content />
    } @else if (activeEmptyTemplate()) {
      <ng-container [ngTemplateOutlet]="activeEmptyTemplate()!.templateRef" />
    }
  `,
})
export class CngxCardGrid {
  readonly minWidth = input<string>('280px');
  readonly gap = input<string>('var(--cngx-gap-md, 16px)');
  readonly density = input<'compact' | 'default' | 'comfortable'>('default');
  readonly semanticList = input<boolean>(false);

  // Optional — Grid funktioniert als reines Layout-Tool ohne Datenbindung.
  // Wenn übergeben: empty-State wird abgeleitet. Wenn nicht: Empty-Slot wird nie gezeigt.
  readonly items = input<readonly unknown[] | undefined>(undefined);
  readonly emptyReason = input<EmptyReason | undefined>(undefined);

  readonly empty = computed(() => {
    const i = this.items();
    return i !== undefined && i.length === 0;
  });

  // Sammelt alle ng-template[cngxCardGridEmpty] aus dem Consumer-Content
  readonly emptyTemplates = contentChildren(CngxCardGridEmpty);

  // Matcht den richtigen Template gegen den Reason — Fallback auf Template ohne Reason
  readonly activeEmptyTemplate = computed(() => {
    const reason = this.emptyReason();
    const templates = this.emptyTemplates();
    return templates.find(t => t.reason() === reason)
        ?? templates.find(t => !t.reason());
  });
}

type EmptyReason = 'first-use' | 'no-results' | 'cleared';
```

### CngxCardGridEmpty — Marker-Direktive

```typescript
@Directive({
  selector: '[cngxCardGridEmpty]',
  standalone: true,
})
export class CngxCardGridEmpty {
  readonly reason = input<EmptyReason | undefined>(undefined, { alias: 'cngxCardGridEmpty' });
  readonly templateRef = inject(TemplateRef);
}
```

```scss
cngx-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--cngx-card-grid-min, 280px), 1fr));
  gap: var(--cngx-card-grid-gap, 16px);

  &.cngx-card-grid--compact {
    --cngx-card-grid-gap: var(--cngx-gap-xs, 8px);
    --cngx-card-padding: var(--cngx-space-sm, 8px);
  }

  &.cngx-card-grid--comfortable {
    --cngx-card-grid-gap: var(--cngx-gap-lg, 24px);
    --cngx-card-padding: var(--cngx-space-lg, 24px);
  }
}
```

Kein Breakpoint-Management nötig — `auto-fill` + `minmax` macht das Grid intrinsisch responsiv.

### Keyboard-Navigation

`CngxRovingTabindex` aus `@cngx/common/a11y` ist als `hostDirective` eingebunden:

- Arrow Keys navigieren zwischen Cards
- `Enter` / `Space` aktiviert die fokussierte Card
- `Home` / `End` springt zur ersten / letzten Card
- Eine Card im Grid hat `tabindex="0"`, alle anderen `tabindex="-1"`

### Warum kein automatisches `role="list"`?

Ein Grid von Cards ist nicht zwingend eine `<ul>`. `role="list"` erzwingt `role="listitem"` auf jeder Card —
das kollidiert mit `role="article"` auf Display Cards. Nur wenn `semanticList` explizit gesetzt wird,
bekommt das Grid die List-Rolle. Dann muss der Consumer `role="listitem"` auf die Cards setzen.

### Empty States — reason-basierte Template-Selektion

Drei Empty-State-Kontexte brauchen verschiedene UX (uxpatterns.dev):

- **`first-use`** — einladend: zeig was möglich ist, biete primäre Aktion
- **`no-results`** — konstruktiv: erkläre warum, biete Ausweg (Filter zurücksetzen)
- **`cleared`** — bestätigend: alles erledigt

`CngxCardGrid` nutzt `ng-template` + `contentChildren` statt Attribut-basierter `ng-content`-Selektion.
`ng-content select="[attr=value]"` Selektoren sind **statisch** (Compile-Zeit) — sie können nicht zur Laufzeit
zwischen Templates wechseln. `contentChildren` + `ngTemplateOutlet` löst das korrekt:

```html
<cngx-card-grid [items]="patients()" [emptyReason]="emptyReason()">

  @for (patient of patients(); track patient.id) {
    <cngx-card as="button" [ariaLabel]="patient.name">...</cngx-card>
  }

  <!-- Reason-spezifische Empty States via ng-template -->
  <ng-template cngxCardGridEmpty="no-results">
    <cngx-empty-state
      title="Keine Bewohner gefunden"
      description="Passe deine Filterkriterien an">
      <mat-icon cngxEmptyStateIcon>search_off</mat-icon>
      <button cngxEmptyStateAction (click)="resetFilters()">
        Filter zurücksetzen
      </button>
    </cngx-empty-state>
  </ng-template>

  <ng-template cngxCardGridEmpty="first-use">
    <cngx-empty-state
      title="Noch keine Bewohner"
      description="Lege deinen ersten Bewohner an">
      <mat-icon cngxEmptyStateIcon>person_add</mat-icon>
      <button cngxEmptyStateAction (click)="addResident()">
        Bewohner hinzufügen
      </button>
    </cngx-empty-state>
  </ng-template>

  <!-- Fallback ohne Reason -->
  <ng-template cngxCardGridEmpty>
    <cngx-empty-state
      title="Keine Einträge"
      description="Hier gibt es gerade nichts zu sehen" />
  </ng-template>

</cngx-card-grid>
```

Der Consumer leitet `emptyReason` aus eigener Logik ab — nie manuell gesetzt:

```typescript
readonly emptyReason = computed<EmptyReason | undefined>(() => {
  if (this.loading()) return undefined;
  if (this.items().length > 0) return undefined;
  if (this.hasActiveFilters()) return 'no-results';
  if (this.isFirstVisit()) return 'first-use';
  return 'cleared';
});
```

---

## CngxEmptyState — eigenständiges Atom

Lebt in `@cngx/ui` (Level 4) — nicht in `@cngx/common/card`, weil es in Treetables, Listen,
Dashboards wiederverwendet wird. Keine Material-Dependency im Component selbst.

```typescript
@Component({
  selector: 'cngx-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cngx-empty-state',
    role: 'status',
    'aria-live': 'polite',
    '[attr.aria-labelledby]': 'titleId',
    '[attr.aria-describedby]': 'description() ? descriptionId : null',
  },
  template: `
    <ng-content select="[cngxEmptyStateIcon]" />
    <ng-content select="[cngxEmptyStateIllustration]" />
    <h3 [id]="titleId" class="cngx-empty-state__title">{{ title() }}</h3>
    @if (description()) {
      <p [id]="descriptionId" class="cngx-empty-state__description">
        {{ description() }}
      </p>
    }
    <div class="cngx-empty-state__actions">
      <ng-content select="[cngxEmptyStateAction]" />
    </div>
    <ng-content select="[cngxEmptyStateSecondary]" />
  `,
})
export class CngxEmptyState {
  private readonly elementId = inject(UniqueIdService).next('cngx-empty');

  readonly title = input.required<string>();
  readonly description = input<string | undefined>(undefined);

  protected readonly titleId = `${this.elementId}-title`;
  protected readonly descriptionId = `${this.elementId}-desc`;
}
```

### Warum Icon-Slot statt `mat-icon` Dependency?

`CngxEmptyState` wird in Treetables, Listen, Dashboards wiederverwendet — manche Consumers verwenden
ein anderes Icon-System. `[cngxEmptyStateIcon]` ist eine leere `ng-content`-Region die null Dependency hat.
Wer Material nutzt projiziert `<mat-icon>`, wer ein SVG-System hat projiziert `<svg>`.
Die Component bleibt neutral — Komposition statt implizite Dependency.

### Warum `role="status"` korrekt ist

`role="status"` + `aria-live="polite"` ist das richtige ARIA-Pattern: Das initiale Rendering ist kein
SR-Event — SR liest es nur bei Fokus. Erst der Wechsel von Content zu Empty (oder umgekehrt) ist das
SR-relevante Event. `polite` statt `assertive` weil ein leerer State keine dringende Unterbrechung ist.

```scss
cngx-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cngx-empty-gap, var(--cngx-space-md, 16px));
  padding: var(--cngx-empty-padding, var(--cngx-space-xl, 48px)) var(--cngx-space-md, 16px);
  text-align: center;
  color: var(--cngx-empty-color, var(--mat-sys-on-surface-variant, #49454f));
}

.cngx-empty-state__title {
  margin: 0;
  font-size: var(--cngx-empty-title-size, 1.125rem);
  font-weight: var(--cngx-empty-title-weight, 500);
  color: var(--cngx-empty-title-color, var(--mat-sys-on-surface, #1d1b20));
}

.cngx-empty-state__description {
  margin: 0;
  font-size: var(--cngx-empty-desc-size, 0.875rem);
  line-height: 1.5;
  max-width: 40ch;
}

.cngx-empty-state__actions {
  display: flex;
  gap: var(--cngx-space-sm, 8px);
  margin-top: var(--cngx-space-sm, 8px);
}
```

---

## Composable Atoms — statt Molecules

Kein `CngxDataTile`. Stattdessen kleine, orthogonale Atome die in **jeder** Card-Variante funktionieren:
Nav Tiles, KPI Tiles, Detail Tiles, Assessment Tiles, Wrapper Cards.

### CngxMetric — formatierte Zahl + Unit

```typescript
@Component({
  selector: 'cngx-metric',
  host: { '[attr.aria-label]': 'accessibleValue()' },
  template: `
    <span class="cngx-metric__value">{{ formattedValue() }}</span>
    @if (unit()) {
      <span class="cngx-metric__unit">{{ unit() }}</span>
    }
  `,
})
export class CngxMetric {
  readonly value = input.required<number | string | null>();
  readonly unit = input<string | undefined>(undefined);
  readonly format = input<Intl.NumberFormatOptions | undefined>(undefined);
  // LOCALE_ID inject, Intl.NumberFormat, null → em-dash
}
```

### CngxTrend — Trend-Arrow + Percentage

```typescript
@Component({
  selector: 'cngx-trend',
  host: {
    '[class.cngx-trend--up]': 'value() > 0',
    '[class.cngx-trend--down]': 'value() < 0',
    '[attr.aria-label]': 'resolvedLabel()',
  },
  template: `<span aria-hidden="true">{{ icon() }}</span> {{ formattedValue() }}`,
})
export class CngxTrend {
  readonly value = input.required<number>();
  readonly label = input<string | undefined>(undefined); // Consumer-Override
  // computed: icon (↑/↓/→), formattedValue (+5.3 %), resolvedLabel (fallback)
}
```

Consumer-Override für `label` — der Consumer kennt den Kontext besser
("vs. Vormonat", "gegenüber Q3") als eine generische Library-Default.

### CngxCardBadge — positioniertes Badge

```typescript
@Directive({
  selector: '[cngxCardBadge]',
  host: { class: 'cngx-card__badge', '[class]': '...' },
})
export class CngxCardBadge {
  readonly position = input<'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'>('top-end');
}
```

### CngxCardTimestamp — formatiertes Datum

```typescript
@Component({
  selector: 'cngx-card-timestamp',
  template: `
    @if (prefix()) { <span>{{ prefix() }}</span> }
    <time [attr.datetime]="isoDate()">{{ formattedDate() }}</time>
  `,
})
export class CngxCardTimestamp {
  readonly date = input.required<Date | string>();
  readonly prefix = input<string | undefined>(undefined);
  readonly format = input<Intl.DateTimeFormatOptions | undefined>(undefined);
  // LOCALE_ID inject, Intl.DateTimeFormat
}
```

### CngxCardTitle + CngxCardSubtitle — strukturierte Typografie

```typescript
@Directive({ selector: '[cngxCardTitle]', host: { class: 'cngx-card__title' } })
export class CngxCardTitle {}

@Directive({ selector: '[cngxCardSubtitle]', host: { class: 'cngx-card__subtitle' } })
export class CngxCardSubtitle {}
```

Konsistente Font-Größe und -Gewicht im Header. `CngxCardTitle` = `1rem/600`,
`CngxCardSubtitle` = `0.8125rem/400` muted. Beide via CSS Custom Properties überschreibbar.

### CngxCardAccent — farbcodierter Severity-Indikator

```typescript
@Directive({
  selector: '[cngxCardAccent]',
  host: { '[class.cngx-card--accent-warning]': 'severity() === "warning"', ... },
})
export class CngxCardAccent {
  readonly severity = input<'info' | 'success' | 'warning' | 'danger' | 'neutral'>('neutral',
    { alias: 'cngxCardAccent' });
}
```

Farbiger Top-Border + getönter Hintergrund. Differenziert nicht nur durch Farbe — Border-Breite
und Hintergrund-Tönung sind unabhängige visuelle Kanäle (WCAG 1.4.1).

### CngxCardSkeleton — Loading-Placeholder

```typescript
@Component({
  selector: 'cngx-card-skeleton',
  host: { 'aria-hidden': 'true' },
  template: `
    @if (showMedia()) { <div class="cngx-card-skeleton__media"></div> }
    <div class="cngx-card-skeleton__title"></div>
    @for (_ of lineArray(); track $index) {
      <div class="cngx-card-skeleton__line" [style.width]="..."></div>
    }
  `,
})
export class CngxCardSkeleton {
  readonly lines = input<number>(3);
  readonly showMedia = input<boolean>(false);
}
```

Shimmer-Rectangles die typische Card-Layouts matchen. Consumer nutzt `@if (loading())` zum Switchen.
`prefers-reduced-motion` zeigt statisches Grau statt Animation.

### Warum keine CngxDataTile

`CngxDataTile` war ein God-Component — ein Organism das sich als Atom tarnte.
Es bündelte Value-Formatting, Trend-Berechnung, Loading-Skeleton, Accessible-Label-Komposition
und Chart-Slot in einer Komponente. Das ist "Konfiguration statt Komposition" — genau was CNGX ablehnt.

Die Screenshots aus der realen Anwendung zeigen 6+ Card-Varianten (Nav Tiles, Count Tiles,
Metric+Chart, Detail Tiles, Assessment Tiles, Wrapper Cards). `CngxDataTile` deckte davon
genau eine ab. Die Atome decken alle ab.

---

## SCSS — Cards

```scss
cngx-card {
  display: block;
  position: relative;
  padding: var(--cngx-card-padding, var(--cngx-space-md, 16px));
  border-radius: var(--cngx-card-radius, var(--cngx-radius-md, 12px));
  background: var(--cngx-card-bg, var(--mat-sys-surface-container-low, #fff));
  border: var(--cngx-card-border, 1px solid var(--mat-sys-outline-variant, #c4c7c5));
  color: var(--cngx-card-color, var(--mat-sys-on-surface, #1d1b20));
  transition:
    box-shadow 150ms ease,
    border-color 150ms ease;

  // Minimum touch target
  min-height: 44px;
  touch-action: manipulation;

  // --- Interactive ---
  &.cngx-card--interactive {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      box-shadow: var(
        --cngx-card-hover-shadow,
        0 2px 8px 0 color-mix(in srgb, var(--mat-sys-shadow, #000) 12%, transparent)
      );
    }

    @media (hover: none) {
      &:active {
        opacity: var(--cngx-card-active-opacity, 0.88);
      }
    }
  }

  // --- Focus ---
  &:focus-visible {
    outline: var(--cngx-card-focus-width, 2px) solid
      var(--cngx-card-focus-color, var(--mat-sys-primary, #6750a4));
    outline-offset: var(--cngx-card-focus-offset, 2px);
  }

  // Interactive Cards: focus-within statt focus-visible auf Host
  // verhindert doppelte Fokusringe bei inneren Buttons
  &:has(:focus-visible):not(:focus-visible) {
    outline: var(--cngx-card-focus-width, 2px) solid
      var(--cngx-card-focus-color, var(--mat-sys-primary, #6750a4));
    outline-offset: var(--cngx-card-focus-offset, 2px);
  }

  // --- Selected ---
  &.cngx-card--selected {
    border-color: var(--cngx-card-selected-border, var(--mat-sys-primary, #6750a4));
    background: var(
      --cngx-card-selected-bg,
      color-mix(in srgb, var(--mat-sys-primary, #6750a4) 8%, var(--cngx-card-bg, #fff))
    );

    // Visueller Indikator der nicht nur Farbe ist (uxpatterns.dev: color is not sole indicator)
    &::before {
      content: '';
      position: absolute;
      inset-inline-start: 0;
      inset-block: var(--cngx-card-radius, 12px);
      width: var(--cngx-card-selected-bar-width, 3px);
      background: var(--cngx-card-selected-border, var(--mat-sys-primary, #6750a4));
      border-radius: 999px;
    }
  }

  // --- Disabled ---
  &.cngx-card--disabled {
    opacity: var(--cngx-card-disabled-opacity, 0.5);
    pointer-events: none;
  }

  // --- Loading ---
  &.cngx-card--loading {
    pointer-events: none;
  }
}

// --- Slots ---
.cngx-card__media {
  margin: calc(-1 * var(--cngx-card-padding, 16px));
  margin-bottom: 0;
  overflow: hidden;
  border-radius: var(--cngx-card-radius, 12px) var(--cngx-card-radius, 12px) 0 0;

  img,
  video {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }
}

.cngx-card__header {
  display: flex;
  align-items: flex-start;
  gap: var(--cngx-space-sm, 8px);
  padding-block: var(--cngx-space-xs, 4px);
}

.cngx-card__body {
  padding-block: var(--cngx-space-xs, 4px);
}

.cngx-card__footer {
  margin-top: auto;
  padding-block-start: var(--cngx-space-sm, 8px);
}

.cngx-card__actions {
  display: flex;
  align-items: center;
  gap: var(--cngx-space-sm, 8px);
  padding-block-start: var(--cngx-space-sm, 8px);
  border-top: 1px solid var(--cngx-card-divider, var(--mat-sys-outline-variant, #c4c7c5));

  &--end {
    justify-content: flex-end;
  }
}

// --- Skeleton ---
.cngx-tile__skeleton {
  display: block;
  height: 2rem;
  border-radius: var(--cngx-radius-sm, 4px);
  background: linear-gradient(
    90deg,
    var(--cngx-skeleton-bg, #e0e0e0) 25%,
    var(--cngx-skeleton-shimmer, #f5f5f5) 50%,
    var(--cngx-skeleton-bg, #e0e0e0) 75%
  );
  background-size: 200% 100%;
  animation: cngx-shimmer 1.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.7;
  }
}

@keyframes cngx-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// --- SR-only ---
.cngx-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Wie alles zusammenspielt

### Nav Tile (Icon + Label + Badge)

```html
<cngx-card as="button" (clicked)="openPflegeplan()">
  <mat-icon cngxCardMedia [decorative]="true">description</mat-icon>
  <span cngxCardHeader>Pflegeplan</span>
  <cngx-status-badge cngxCardBadge status="pending" variant="dot" />
</cngx-card>
```

### KPI Tile (Metric + Trend + Chart)

```html
<cngx-card>
  <header cngxCardHeader>
    <span>Puls</span>
    <cngx-trend [value]="stats().pulsTrend" />
  </header>
  <cngx-metric cngxCardBody [value]="75" unit="bpm" />
  <cngx-sparkline cngxCardFooter [data]="pulsHistory()" type="line" />
</cngx-card>
```

### Count Tile

```html
<cngx-card as="button" (clicked)="openDiagnosen()">
  <cngx-metric cngxCardMedia [value]="7" />
  <span cngxCardHeader>Med. Diagnosen</span>
  <cngx-status-badge cngxCardBadge status="pending" variant="dot" />
</cngx-card>
```

### Assessment Tile (Chart + Score + Timestamp)

```html
<cngx-card>
  <header cngxCardHeader>
    <span>Sturzrisiko</span>
    <cngx-metric [value]="26" />
  </header>
  <cngx-sparkline cngxCardBody [data]="sturzData()" type="bar" />
  <footer cngxCardFooter>
    <cngx-card-timestamp [date]="evaluationDate()" prefix="Evaluierung am:" />
    <cngx-status-badge cngxCardBadge status="warning" variant="dot" />
  </footer>
</cngx-card>
```

### Selectable Action Cards

```html
<cngx-card-grid [semanticList]="true">
  @for (patient of patients(); track patient.id) {
    <cngx-card as="button" [selectable]="true" [(selected)]="patient.selected"
               [ariaLabel]="patient.name + ', Zimmer ' + patient.room" role="listitem">
      <div cngxCardMedia [decorative]="true">
        <cngx-avatar [name]="patient.name" />
      </div>
      <header cngxCardHeader>
        <h3>{{ patient.name }}</h3>
        <span>Zimmer {{ patient.room }}</span>
      </header>
      <footer cngxCardFooter>
        <cngx-status-badge [status]="patient.status" />
      </footer>
    </cngx-card>
  }
</cngx-card-grid>
```

### Wrapper Card (Cards in Cards)

```html
<cngx-card>
  <header cngxCardHeader>
    <span>1000004: Angst</span>
    <div cngxCardActions align="end">
      <button>Ä</button><button>RES</button><button>S</button>
    </div>
  </header>
  <cngx-card-grid cngxCardBody minWidth="200px" density="compact">
    @for (goal of goals(); track goal.id) {
      <cngx-card>
        <div cngxCardBody>{{ goal.description }}</div>
        <cngx-card-timestamp cngxCardFooter [date]="goal.evaluationDate" />
      </cngx-card>
    }
  </cngx-card-grid>
</cngx-card>
```

### Disabled Card mit Reason

```html
<cngx-card as="button" [disabled]="!hasPermission()"
           disabledReason="Nur Pflegepersonal kann Bewohner bearbeiten">
  <div cngxCardBody>...</div>
</cngx-card>
```

---

## Was mat-card nicht kann

| Dimension                 | `mat-card`                         | `cngx-card`                                            |
| ------------------------- | ---------------------------------- | ------------------------------------------------------ |
| Semantisches Host-Element | immer `<div>`                      | `role="article"` / `"button"` / `"link"` je nach `as`  |
| Action Card               | Wrapper-Hacks (`<a>` um die Card)  | `as="button"` — ein Attribut, Host ist der Button      |
| SR Label                  | manuell, keine Guidance            | `ariaLabel` Input + Live-Region                        |
| Selection                 | nicht eingebaut                    | `[(selected)]` model, Keyboard-Toggle                  |
| Loading                   | nicht eingebaut                    | `[loading]` + Skeleton + `aria-busy` + SR-Announcement |
| Disabled + Reason         | nicht eingebaut                    | `[disabled]` + `disabledReason` + `aria-describedby`   |
| Grid Layout               | nicht eingebaut                    | `CngxCardGrid` mit intrinsischem Layout                |
| Keyboard-Navigation       | nicht eingebaut                    | Roving Tabindex via `CngxRovingTabindex`               |
| KPI / Trend               | nicht eingebaut                    | `CngxMetric` + `CngxTrend` Atome (composable)         |
| Touch                     | keine Sonderbehandlung             | `touch-action: manipulation` + Active-Feedback         |
| Fokusring                 | Theme-abhängig, oft unsichtbar     | explizit, kontraststarker `:focus-visible`             |
| Density                   | nicht eingebaut                    | `compact` / `default` / `comfortable`                  |
| i18n                      | n/a                                | `$localize` SR-Announcements, `LOCALE_ID` Formatting   |
| Selection-Indikator       | n/a                                | Farbe + vertikaler Bar (nicht nur Farbe)               |
| DX: Export-Count          | 16 Exports                         | 13 Exports (Card + Slots + Grid + Atoms)               |
| DX: Hidden Wrappers       | `.mat-mdc-card-header-text` DIV    | keine — Slots sind Attribute-Direktiven                |
| DX: CSS Override          | 2000+ Zeichen inline, hardcoded px | CSS Custom Properties durchgängig                      |

---

## Entry Point

```
@cngx/common/card/          Level 2
  CngxCard                   Semantic host (article/button/link)
  CngxCardHeader             Slot-Direktive (flex-wrap Container)
  CngxCardTitle              Heading-Typografie (1rem/600)
  CngxCardSubtitle           Sekundärtext (0.8125rem/400, muted)
  CngxCardBody               Slot-Direktive
  CngxCardMedia              Slot-Direktive (decorative, aspectRatio)
  CngxCardFooter             Slot-Direktive
  CngxCardActions            Slot-Direktive (align)
  CngxCardBadge              Positioniertes Badge (4 Ecken)
  CngxCardAccent             Severity-basierter Top-Border + getönter Hintergrund
  CngxCardSkeleton           Shimmer-Placeholder (lines, showMedia)
  CngxCardGrid               CSS Grid + Roving Tabindex + Empty State
  CngxCardGridEmpty          ng-template Marker mit EmptyReason
  CngxMetric                 Formatierte Zahl + Unit (LOCALE_ID)
  CngxTrend                  Trend-Arrow + Percentage + Consumer-Label
  CngxCardTimestamp           Formatiertes Datum (LOCALE_ID)
  EmptyReason                Type

@cngx/ui/empty-state/       Level 4
  CngxEmptyState             role="status", Default-SVG, Icon/Action Slots
```

`@cngx/common/card` — kein Material, kein CDK (nur `CngxRovingTabindex` aus eigenem `a11y`).
`CngxEmptyState` in `@cngx/ui/empty-state` — wiederverwendbar in Treetables, Listen, Dashboards.

Material Theme-Dateien: `card-theme.scss` (M3/M2) und `empty-state-theme.scss` (M3/M2).

---

## Entschiedene Design-Fragen

1. **View-Toggle Grid ↔ List** — Consumer-Sache. Ein Toggle ist ein `signal<'grid' | 'list'>()` im Consumer
   und zwei CSS-Klassen auf `cngx-card-grid`. Der Grid-Component kennt keinen UI-State der nichts mit Layout zu tun hat.

2. **Empty State** — `ng-template[cngxCardGridEmpty]` + `contentChildren` + `ngTemplateOutlet`.
   Optionaler `items` Input (`input<readonly unknown[] | undefined>(undefined)`) treibt `empty` computed.
   Optionaler `emptyReason` Input (`'first-use' | 'no-results' | 'cleared'`) selektiert das richtige Template.
   Fallback: Template ohne Reason als Default-Case. `ng-content select` Attribut-Selektoren sind statisch
   (Compile-Zeit) — `contentChildren` + `ngTemplateOutlet` ist die einzig korrekte Lösung für runtime-selektierten
   projected Content. `CngxEmptyState` als eigenständiges Atom in `@cngx/ui` — Icon-Slot statt `mat-icon`
   Dependency (Komposition statt implizite Kopplung).

3. **Sparkline** — Eigenes Atom in `@cngx/ui` (Level 4). Nicht `@cngx/common/data` (Sort/Filter/Paginate, kein SVG)
   und nicht `@cngx/data-display` (CDK Table). Cards nutzen Sparkline via Content-Projection — kein Dependency-Verstoß.

4. **CngxDataTile entfernt** — War ein God-Component (Konfiguration statt Komposition). Ersetzt durch
   `CngxMetric` + `CngxTrend` + `CngxCardBadge` + `CngxCardTimestamp` — orthogonale Atome die in
   Nav Tiles, Count Tiles, Metric+Chart, Detail Tiles, Assessment Tiles, Wrapper Cards funktionieren.
