# Tooltip & Popover — die cngx-Architektur

Das native **Popover API** ist der Game-Changer. Kein Overlay-Service, kein Portal, kein z-index — der Browser managed den Top Layer. Ersetzt `@cngx/ui/overlay` (CDK Overlay) für alle verankerten Use Cases; CDK Overlay bleibt für programmatisch geöffnete Modals.

Abgrenzung zu `CngxDialog`: Dialog = modale/nicht-modale Dialoge auf `<dialog>` mit Scroll-Lock, Backdrop, Stack. Popover = leichtgewichtige positionierte Overlays auf beliebigen Elementen — Tooltips, Dropdowns, Datepicker. Kein Scroll-Lock, kein Backdrop, kein Stack.

---

## Das Fundament: `[cngxPopover]` Atom

Ein einzelnes Atom, das den gesamten Popover-Lifecycle als Signal-Zustandsmaschine wrapped. **Reine Zustandsmaschine** — kennt keine Trigger-Logik, keine Delays. Analog zu `CngxDialog`.

```typescript
let nextPopoverUid = 0;

@Directive({
  selector: '[cngxPopover]',
  exportAs: 'cngxPopover',
  standalone: true,
  host: {
    'popover': 'manual',
    '[id]': 'id()',
    '[attr.aria-hidden]': '!isVisible()',
    '[class.cngx-popover--opening]': 'isOpening()',
    '[class.cngx-popover--open]': 'isOpen()',
    '[class.cngx-popover--closing]': 'isClosing()',
    '(beforetoggle)': 'handleBeforeToggle($event)',
    '(toggle)': 'handleToggle($event)',
    '(keydown.escape)': 'handleEscape()',
  },
})
export class CngxPopover {
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);

  // ── Inputs ────────────────────────────────────────────────────────
  readonly placement = input<PopoverPlacement>('bottom');
  readonly offset = input(8);
  readonly closeOnEscape = input(true);

  /**
   * Controlled open state. Wenn gesetzt, steuert dieser Input den Popover
   * reaktiv — kein show()/hide() nötig. Für den error-popover-Use-Case.
   */
  readonly controlledOpen = input<boolean | undefined>(undefined, { alias: 'cngxPopoverOpen' });

  // ── State ─────────────────────────────────────────────────────────
  private readonly stateSignal = signal<PopoverState>('closed');
  private readonly idSignal = signal(`cngx-popover-${nextPopoverUid++}`);

  readonly state = this.stateSignal.asReadonly();
  readonly id = this.idSignal.asReadonly();

  // ── Computed (protected — für host bindings) ──────────────────────
  protected readonly isOpening = computed(() => this.stateSignal() === alapértelmezett'opening');
  protected readonly isOpen = computed(() => this.stateSignal() === 'open');
  protected readonly isClosing = computed(() => this.stateSignal() === 'closing');
  protected readonly isVisible = computed(() => this.stateSignal() !== 'closed');

  constructor() {
    // Controlled open: reagiert auf Input-Änderungen
    effect(() => {
      const desired = this.controlledOpen();
      if (desired === undefined) return; // uncontrolled mode
      if (desired && this.stateSignal() === 'closed') this.show();
      if (!desired && this.stateSignal() === 'open') this.hide();
    });
  }

  // ── Public API ────────────────────────────────────────────────────
  show(): void {
    if (this.stateSignal() !== 'closed') return;
    this.stateSignal.set('opening');
    this.elRef.nativeElement.showPopover();
    requestAnimationFrame(() => {
      if (this.stateSignal() === 'opening') this.stateSignal.set('open');
    });
  }

  hide(): void {
    if (this.stateSignal() !== 'open' && this.stateSignal() !== 'opening') return;
    this.startClosing();
  }

  toggle(): void {
    if (this.stateSignal() === 'closed') this.show();
    else this.hide();
  }

  // ── Event handlers ────────────────────────────────────────────────
  protected handleBeforeToggle(e: ToggleEvent): void {
    // Sync mit Browser-State wenn nötig (z.B. light dismiss bei popover="auto")
  }

  protected handleToggle(e: ToggleEvent): void {
    if (e.newState === 'closed' && this.stateSignal() !== 'closed') {
      this.stateSignal.set('closed');
      this.elRef.nativeElement.hidePopover?.();
    }
  }

  protected handleEscape(): void {
    if (this.closeOnEscape()) this.hide();
  }

  // ── Private ───────────────────────────────────────────────────────
  private startClosing(): void {
    // Transition-aware closing analog zu CngxDialog
    if (this.hasTransition()) {
      this.stateSignal.set('closing');
      this.listenForTransitionEnd();
    } else {
      this.finalize();
    }
  }

  private finalize(): void {
    this.elRef.nativeElement.hidePopover();
    this.stateSignal.set('closed');
  }

  // hasTransition(), listenForTransitionEnd() analog zu CngxDialog
}

type PopoverState = 'closed' | 'opening' | 'open' | 'closing';
type PopoverPlacement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';
```

### Warum `popover="manual"`?

`popover="auto"` gibt Light Dismiss geschenkt — aber auch unkontrollierbares Schließen. Für hover-basierte Tooltips ist das fatal (Mausbewegung zum Popover schließt ihn). `manual` gibt uns volle Kontrolle über den Lifecycle.
Light Dismiss wird per `CngxClickOutside` (existiert bereits in `@cngx/common/interactive`) als hostDirective auf den Trigger-Molekülen realisiert.

---

## Der Trigger: `[cngxPopoverTrigger]` Atom

Rein deklarativ — ARIA-Attribute, explizite Referenz, keine Event-Handler. Der Trigger ist ein reines ARIA-Atom. **Click/Hover/Focus-Logik gehört in Molecules**, nicht hierhin.

```typescript
@Directive({
  selector: '[cngxPopoverTrigger]',
  exportAs: 'cngxPopoverTrigger',
  standalone: true,
  host: {
    '[attr.aria-expanded]': 'popoverRef().isVisible()',
    '[attr.aria-controls]': 'popoverRef().id()',
    '[attr.aria-haspopup]': 'haspopup()',
  },
})
export class CngxPopoverTrigger {
  readonly popoverRef = input.required<CngxPopover>({ alias: 'cngxPopoverTrigger' });
  readonly haspopup = input<'dialog' | 'listbox' | 'menu' | 'true'>('true');

  /** Trigger-Element für Focus-Return nach dem Schließen. */
  readonly triggerElement = computed(() => inject(ElementRef).nativeElement as HTMLElement);
}
```

---

## Positioning: CSS Anchor + Fallback

Natives Popover gibt Top Layer — aber kein Positioning. Zwei Strategien, feature-detected zur Laufzeit.

### Option A — CSS Anchor Positioning (Chrome 125+)

Kein JavaScript für Positioning — reines CSS. Kein ResizeObserver, kein scroll listener.

```typescript
// Im CngxPopoverTrigger: anchor-name setzen
host: {
  '[style.anchor-name]': '"--" + popoverRef().id()',
}

// Im CngxPopover: position-anchor referenzieren
host: {
  '[style.position-anchor]': '"--" + id()',
  '[style.position-area]': 'cssPositionArea()',
}
```

```typescript
protected readonly cssPositionArea = computed(() => {
  const map: Record<PopoverPlacement, string> = {
    'top':          'top span-all',
    'top-start':    'top span-inline-start',
    'top-end':      'top span-inline-end',
    'bottom':       'bottom span-all',
    'bottom-start': 'bottom span-inline-start',
    'bottom-end':   'bottom span-inline-end',
    'left':         'left span-all',
    'right':        'right span-all',
  };
  return map[this.placement()];
});
```

### Option B — Floating UI Fallback

Für Browser ohne CSS Anchor Positioning:

```typescript
private readonly supportsAnchor = CSS.supports('position-area', 'bottom');

// Fallback: computePosition() aus @floating-ui/dom
// Einmalig bei show(), kein continuous listener.
// @floating-ui/dom ist optional peer dependency (~3KB).
```

**Entscheidung:** CSS Anchor primär. Floating UI als optionale peer dependency für den Fallback. Feature-Detection per `CSS.supports()` im Popover-Atom, gecacht als statisches Feld.

---

## Tooltip — Molecule über `[cngxPopover]`

Tooltip composet `CngxPopover` via `hostDirectives` — kein Extra-DOM-Wrapper. `CngxTooltipTrigger` handled Hover/Focus und verwaltet Delays.

```typescript
let nextTooltipUid = 0;

@Component({
  selector: 'cngx-tooltip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{
    directive: CngxPopover,
    inputs: ['placement:placement', 'offset:offset'],
  }],
  host: {
    'role': 'tooltip',
    '[id]': 'tooltipId()',
  },
  template: `<ng-content />`,
  exportAs: 'cngxTooltip',
})
export class CngxTooltip {
  private readonly uid = nextTooltipUid++;
  readonly popover = inject(CngxPopover, { self: true });
  readonly tooltipId = computed(() => `cngx-tooltip-${this.uid}`);
}
```

### `[cngxTooltipTrigger]` — Hover/Focus Molecule

Hier leben Delays und Hover-Logik — nicht im Popover-Atom.

```typescript
@Directive({
  selector: '[cngxTooltipTrigger]',
  standalone: true,
  hostDirectives: [{
    directive: CngxPopoverTrigger,
  }],
  host: {
    '[attr.aria-describedby]': 'tooltipRef().tooltipId()',
    '(mouseenter)': 'handleMouseEnter()',
    '(mouseleave)': 'handleMouseLeave()',
    '(focus)': 'handleFocus()',
    '(blur)': 'handleBlur()',
    '(keydown.escape)': 'handleEscape()',
  },
})
export class CngxTooltipTrigger {
  private readonly destroyRef = inject(DestroyRef);
  private readonly popoverTrigger = inject(CngxPopoverTrigger, { self: true });

  readonly tooltipRef = input.required<CngxTooltip>({ alias: 'cngxTooltipTrigger' });
  readonly openDelay = input(300);
  readonly closeDelay = input(100);

  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // CngxPopoverTrigger bekommt die Popover-Referenz vom Tooltip
    effect(() => {
      // Wire popoverTrigger.popoverRef → tooltipRef().popover
    });

    this.destroyRef.onDestroy(() => {
      if (this.openTimer) clearTimeout(this.openTimer);
      if (this.closeTimer) clearTimeout(this.closeTimer);
    });
  }

  protected handleMouseEnter(): void {
    this.clearCloseTimer();
    this.openTimer = setTimeout(() => this.tooltipRef().popover.show(), this.openDelay());
  }

  protected handleMouseLeave(): void {
    this.clearOpenTimer();
    this.closeTimer = setTimeout(() => this.tooltipRef().popover.hide(), this.closeDelay());
  }

  protected handleFocus(): void { this.tooltipRef().popover.show(); }
  protected handleBlur(): void { this.tooltipRef().popover.hide(); }
  protected handleEscape(): void { this.tooltipRef().popover.hide(); }

  private clearOpenTimer(): void {
    if (this.openTimer) { clearTimeout(this.openTimer); this.openTimer = null; }
  }
  private clearCloseTimer(): void {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
  }
}
```

### Usage

```html
<!-- Tooltip -->
<button [cngxTooltipTrigger]="tip">Speichern</button>
<cngx-tooltip #tip="cngxTooltip" placement="top">Strg+S</cngx-tooltip>

<!-- Click Popover -->
<button [cngxPopoverTrigger]="myPop" (click)="myPop.toggle()">Optionen</button>
<div cngxPopover #myPop="cngxPopover" placement="bottom-start">
  <menu>
    <li>Bearbeiten</li>
    <li>Löschen</li>
  </menu>
</div>

<!-- Reaktiver Error-Popover -->
<input cngxInput [cngxPopoverTrigger]="errPop"
       [attr.aria-errormessage]="errPop.id()" />
<div cngxPopover #errPop="cngxPopover"
     [cngxPopoverOpen]="field().invalid() && field().touched()"
     role="alert">
  {{ field().errorSummary() }}
</div>
```

A11y: `role="tooltip"` + `aria-describedby` auf dem Trigger. Tooltip-Content wird vom Screen Reader als Beschreibung gelesen — nicht als separates Element announced. Error-Popover nutzt `role="alert"` + `aria-errormessage` für sofortige SR-Announcements.

---

## Reaktive API

Weil alles Signal-based ist, kann der Consumer reaktiv reagieren ohne Events:

```typescript
// Im Consumer-Component
readonly popover = viewChild(CngxPopover);
readonly isOpen = computed(() => this.popover()?.state() === 'open');
```

Oder komplett deklarativ im Template via `[cngxPopoverOpen]` — kein Event-Handler, kein Glue-Code.

---

## Die vollständige Familie

```
@cngx/common/popover (Level 2 — kein Material)

Atoms:
├── CngxPopover              — State-Machine, Top Layer, Transitions, Exclusive Mode
├── CngxPopoverTrigger       — ARIA (expanded, controls, haspopup), Anchor Registration

Molecules:
├── CngxTooltip              — String-Input Directive, hover/focus + debounce, CngxReducedMotion
├── CngxPopoverPanel         — Header/Body/Footer, Variants, Arrow, Close, Content States
├── CngxPopoverAction        — Async footer buttons (CngxAsyncClick + Templates)

Slot Directives:
├── CngxPopoverHeader/Body/Footer/Close
├── CngxPopoverLoading/Empty/Error

Config:
├── providePopoverPanel()    — withCloseButton, withArrow, withAutoDismiss, withCloseOnSuccess
├── provideFloatingFallback()— opt-in @floating-ui/dom für alte Browser

Künftige Molecules:
├── CngxDropdown             — click + role="menu" + keyboard nav
├── CngxCombobox             — input + listbox + aria-activedescendant
└── CngxDatepicker           — date input + calendar grid popover
```

Alle bauen auf demselben `[cngxPopover]`-Atom auf. Ein Fundament, endlose Komposition.

---

## Entschiedene Fragen

1. **Floating UI** — Optional peer dependency. Consumer opted in via `provideFloatingFallback(computePosition, middleware)`. Zero Bundle Impact für moderne Browser.
2. **Popover API Polyfill** — Consumer-Verantwortung (`@oddbird/popover-polyfill`). DevMode-Warnung wenn API fehlt.
3. **Hover-Bridge** — `closeDelay` (100ms) als pragmatische Lösung. Reicht für non-interactive Tooltips.
4. **`popover="auto"`** — Via `mode`-Input auf CngxPopover konfigurierbar. Default: `manual`.
5. **Tooltip als String-Directive** — Kein separates `<cngx-tooltip>` Element. Directive auf dem Trigger, Tooltip-Element intern via Renderer2.
6. **Template-Marker** — `CngxPending`/`CngxSucceeded`/`CngxFailed` in `@cngx/common/interactive` (shared mit `CngxActionButton`).
