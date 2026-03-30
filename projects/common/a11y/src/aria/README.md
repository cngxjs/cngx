# ARIA Attributes

Reactive directives for declarative ARIA attribute management. Handles disclosure patterns (`aria-expanded`/`aria-controls`) and screen reader announcements via live regions.

## Directives

### CngxAriaExpanded

Manages `aria-expanded` and `aria-controls` on a trigger element (button or link). Couples both attributes in a single declaration, preventing mismatches where one is set without the other.

#### Import

```typescript
import { CngxAriaExpanded } from '@cngx/common/a11y';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxAriaExpanded` | `boolean` | `false` | Whether the controlled element is currently expanded. Sets `aria-expanded`. |
| `controls` | `string \| undefined` | `undefined` | The `id` of the controlled element. Sets `aria-controls`. |

#### Example

```typescript
// Simple disclosure
<button [cngxAriaExpanded]="open()" [controls]="'panel-id'" (click)="open.set(!open())">
  Toggle
</button>
<div id="panel-id" role="region" [hidden]="!open()">Panel content</div>

// Accordion with multiple panels
@for (panel of panels(); track panel.id) {
  <button [cngxAriaExpanded]="panel.open" [controls]="panel.id" (click)="toggle(panel)">
    {{ panel.label }}
  </button>
  @if (panel.open) {
    <div [id]="panel.id" role="region">{{ panel.content }}</div>
  }
}
```

#### Composition

Pair `CngxAriaExpanded` with `CngxRovingTabindex` for accessible accordion/menu patterns:

```typescript
<div cngxRovingTabindex orientation="vertical">
  @for (item of items(); track item.id) {
    <button cngxRovingItem
            [cngxAriaExpanded]="item.expanded"
            [controls]="item.id"
            (click)="item.expanded = !item.expanded">
      {{ item.label }}
    </button>
    @if (item.expanded) {
      <div [id]="item.id" role="region">{{ item.content }}</div>
    }
  }
</div>
```

#### Notes

- The directive only sets ARIA attributes; visibility logic (`[hidden]`) is the consumer's responsibility
- The controlled element must exist in the DOM for the reference to be semantically valid
- Both `aria-expanded` and `aria-controls` are always present on the host

---

### CngxLiveRegion

Configures the host element as an ARIA live region. Screen readers monitor live regions and announce content changes automatically without user action.

#### Import

```typescript
import { CngxLiveRegion } from '@cngx/common/a11y';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `politeness` | `'polite' \| 'assertive' \| 'off'` | `'polite'` | Controls announcement urgency. `'polite'` queues announcements; `'assertive'` interrupts immediately; `'off'` disables announcements. |
| `atomic` | `boolean` | `true` | Whether the entire region is announced as a whole (vs. individual changes). |
| `relevant` | `string` | `'additions text'` | Space-separated list of change types to announce: `additions`, `removals`, `text`. |

#### Host Bindings

The directive sets the appropriate ARIA role based on politeness:

- `politeness='polite'` → `role="status"`
- `politeness='assertive'` → `role="alert"`
- `politeness='off'` → no role

#### Example

```typescript
// Status message (polite, queued)
<div cngxLiveRegion politeness="polite">
  {{ statusMessage() }}
</div>

// Form validation error (assertive, interrupts)
<div cngxLiveRegion politeness="assertive"
     [style.color]="error() ? 'red' : 'transparent'">
  {{ error() }}
</div>

// Custom announcement region (respects additions and removals)
<div cngxLiveRegion politeness="polite" relevant="additions removals">
  @for (item of items(); track item.id) {
    <div>{{ item.name }}</div>
  }
</div>

// Dialog title announcement (atomic)
<div cngxLiveRegion politeness="assertive" [atomic]="true" style="display: none;">
  {{ dialogTitle() }}
</div>
```

#### Comparison to CDK LiveAnnouncer

Unlike `LiveAnnouncer` from `@angular/cdk/a11y`:

| Aspect | CngxLiveRegion | LiveAnnouncer |
|-|-|-|
| DOM element | Your own, visible | Hidden element created by service |
| API | Declarative, input binding | Imperative `announce()` call |
| Content source | Template rendering | String argument |
| Lifecycle | Directive lifecycle | Service lifetime |
| Overhead | Minimal | Creates hidden `<div>` |

Use `CngxLiveRegion` when the announcement content is part of your template; use `LiveAnnouncer` for programmatic announcements with custom messaging.

#### Notes

- The region should always be in the DOM (not conditionally rendered), but its content changes reactively
- For hidden announcements (e.g., dialog title on open), hide the region via CSS, not `*ngIf`
- `aria-atomic="false"` is not recommended for mutable regions; keep it `true` (default) for clarity

---

## Accessibility Patterns

### Disclosure / Accordion

```typescript
// Fully accessible accordion pattern
<div cngxRovingTabindex orientation="vertical">
  @for (section of sections(); track section.id) {
    <button cngxRovingItem
            [cngxAriaExpanded]="section.expanded"
            [controls]="section.id"
            (click)="toggleSection(section)"
            aria-label="Toggle {{ section.title }}">
      {{ section.title }}
    </button>
    @if (section.expanded) {
      <div [id]="section.id" role="region">
        {{ section.content }}
      </div>
    }
  }
</div>
```

### Async Operation Status

```typescript
readonly state = injectAsyncState(() => this.loadData$);

<div cngxLiveRegion politeness="polite">
  @switch (state().status()) {
    @case ('loading') {
      Loading…
    }
    @case ('success') {
      Data loaded
    }
    @case ('error') {
      Failed to load: {{ state().error() }}
    }
  }
</div>
```

### Form Errors

```typescript
<div cngxLiveRegion politeness="assertive" [style.display]="error() ? 'block' : 'none'">
  @if (error()) {
    <strong>{{ error().message }}</strong>
  }
</div>
```

---

## Composition

ARIA directives are orthogonal and can be combined freely:

```typescript
// Fully accessible disclosure with dynamic content
@for (item of list(); track item.id) {
  <button [cngxAriaExpanded]="item.expanded"
          [controls]="item.contentId"
          (click)="item.expanded = !item.expanded">
    {{ item.title }}
  </button>
  @if (item.expanded) {
    <div [id]="item.contentId" role="region" cngxLiveRegion politeness="polite">
      {{ item.content }}
    </div>
  }
}
```

---

## See Also

- [CngxRovingTabindex](../roving/README.md) — Keyboard navigation for composite widgets
- [WAI-ARIA: disclosure (Show/Hide) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
- [WAI-ARIA: Alerts](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)
- Compodoc API documentation: `npm run docs:serve`
