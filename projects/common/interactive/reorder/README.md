# Reorder

Keyboard-first reorder primitive for any flat container. The directive emits a fresh array on every settled move, never mutates the source signal, and treats the keyboard path as the primary flow (modifier + arrow / Home / End), not a fallback for missing pointer support. Pointer drag rides on top; consumers own the write-back and the focus restoration. A separate roving-tabindex factory handles the chip-strip focus state that pairs with the reorder gesture inside the select family.

## Import

```ts
import {
  CngxReorder,
  type CngxReorderEvent,
  type CngxReorderModifier,
  CNGX_CHIP_STRIP_ROVING_FACTORY,
  createChipStripRoving,
  type CngxChipStripRovingController,
  type CngxChipStripRovingFactory,
  type CngxChipStripRovingOptions,
} from '@cngx/common/interactive';
```

## Quick start

### Reorderable list

```html
<ul [cngxReorder]="values" (reordered)="apply($event)">
  @for (v of values(); track v.id; let i = $index) {
    <li [attr.data-reorder-index]="i" tabindex="0">
      <button cngxReorderHandle type="button" aria-label="Move {{ v.label }}">
        <cngx-icon><mat-icon>drag_indicator</mat-icon></cngx-icon>
      </button>
      {{ v.label }}
    </li>
  }
</ul>
```

```ts
protected readonly values = signal<readonly Item[]>(initial);

protected apply(event: CngxReorderEvent<Item>): void {
  this.values.set(event.next);
}
```

`Alt+ArrowLeft` / `Alt+ArrowRight` move the focused item by one. `Alt+Home` / `Alt+End` send it to the ends. Plain arrow keys remain free for normal focus traversal.

### Chip strip with roving tabindex

```ts
@Component({
  hostDirectives: [{
    directive: CngxReorder,
    inputs: ['cngxReorder: items'],
    outputs: ['reordered'],
  }],
})
export class ReorderableChipStrip {
  protected readonly items = signal<readonly Tag[]>([]);
  private readonly stripRef = viewChild.required<ElementRef<HTMLElement>>('strip');
  private readonly factory = inject(CNGX_CHIP_STRIP_ROVING_FACTORY);

  protected readonly roving = this.factory({
    count: computed(() => this.items().length),
    container: computed(() => this.stripRef().nativeElement),
  });
}
```

```html
<span #strip class="chip-strip" (keydown)="roving.handleKeydown($event)">
  @for (t of items(); track t.id; let i = $index) {
    <span
      class="chip"
      [attr.data-reorder-index]="i"
      [attr.tabindex]="i === roving.activeIndex() ? 0 : -1"
      (focus)="roving.markFocused(i)"
    >
      {{ t.label }}
    </span>
  }
</span>
```

The directive's `data-reorder-index` attribute doubles as the roving controller's selector hook, so one DOM marker covers both flows.

## `CngxReorder`

Selector: `[cngxReorder]`. Exported as `cngxReorder`. Generic over the item type `T`.

### Inputs

| Input | Type | Default | Purpose |
|-|-|-|-|
| `cngxReorder` | `Signal<readonly T[]>` | required | Authoritative order. Read lazily at drag-start and at every keyboard move. |
| `handleSelector` | `string` | `'[cngxReorderHandle], [data-reorder-handle]'` | Element matched against `pointerdown` target via `closest`. Decides whether the gesture starts. |
| `itemSelector` | `string` | `'[data-reorder-index]'` | Element matched against pointer / keyboard target via `closest`. The matched element's `data-reorder-index` is parsed for `fromIndex` / `toIndex`. |
| `ignoreSelector` | `string \| null` | `null` | Closest-match escape hatch. When the `pointerdown` target matches, the gesture is dropped. Useful for whole-row drag with interactive child exemptions (`'button, a, [contenteditable]'`). |
| `keyboardModifier` | `CngxReorderModifier` | `'alt'` | Modifier required for keyboard reorder. `'ctrl' \| 'alt' \| 'meta'`. |
| `disabled` | `boolean` | `false` | Disables both pointer and keyboard flows. |

### Outputs

| Output | Payload | Fires when |
|-|-|-|
| `reordered` | `CngxReorderEvent<T>` | A drag or keyboard move settles on a new position. |
| `dragStart` | `number` | Pointer drag begins. Payload is the source index. Informational. |
| `dragEnd` | `void` | Pointer drag ends, whether committed, cancelled by `Escape`, or aborted by `pointercancel`. Fires after `reordered` when both apply. |

### Exposed signals

| Member | Type | Notes |
|-|-|-|
| `dragging` | `Signal<boolean>` | `true` while a pointer drag is in progress. Drives the `.cngx-reorder-dragging` host class. |
| `dragFromIndex` | `Signal<number \| null>` | Source index of the in-flight drag, or `null` when idle. |
| `dragOverIndex` | `Signal<number \| null>` | Current hover index during a drag, or `null` when idle. Drives ghost / placeholder positioning. |

### `CngxReorderEvent<T>`

```ts
interface CngxReorderEvent<T> {
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly next: readonly T[];
}
```

`next` is a fresh array. The source signal is never mutated in place, so downstream `computed()` graphs see a new reference and re-evaluate. The consumer writes `next` back to the source (directly, or via a commit controller for optimistic / pessimistic behaviour).

### `CngxReorderModifier`

```ts
type CngxReorderModifier = 'ctrl' | 'alt' | 'meta';
```

Plain arrow keys keep their default meaning. Only `modifier + key` produces a move.

### Pointer behaviour

`pointerdown` on an element matching `handleSelector` inside an item matching `itemSelector` starts a drag. Pointer capture stays on the host so the gesture keeps tracking when the user drifts outside the container. The drop target is resolved from `document.elementFromPoint` on every `pointermove`. The drag ends on `pointerup`, `pointercancel`, or top-level `Escape`. Only `pointerup` commits a move; `pointercancel` and `Escape` cancel without emission. The directive installs a one-shot capture-phase `click` suppressor after every pointer drag so an outer `(click)` listener (e.g. a combobox trigger that opens its popover) is not toggled by the synthetic click the browser derives from the mousedown / mouseup pair.

### Keyboard behaviour

When the focused element is inside an item and the configured modifier + arrow / `Home` / `End` is pressed, the directive emits `reordered` and lets the consumer restore focus (usually via `afterNextRender`).

| Key | Move |
|-|-|
| `modifier + ArrowLeft` / `ArrowUp` | One position toward the start. |
| `modifier + ArrowRight` / `ArrowDown` | One position toward the end. |
| `modifier + Home` | First position. |
| `modifier + End` | Last position. |

### Dev-mode check

In dev mode, the directive runs an `afterNextRender` audit. If any element matching `itemSelector` carries no numeric `data-reorder-index`, a warning is logged. An empty container is not flagged.

## `createChipStripRoving`

Factory for the chip-strip roving-tabindex controller. Used by `CngxReorderableMultiSelect` and any future reorder-aware chip trigger (tag input with user-defined ordering, etc.). Modifier-gated keys are deliberately ignored so the paired `CngxReorder` directive owns that gesture without a double-fire race.

```ts
const roving = createChipStripRoving({
  count: computed(() => items().length),
  container: computed(() => stripRef().nativeElement),
});
```

Call inside an injection context (component constructor or field initialiser). The factory installs an `effect()` that clamps `activeIndex` whenever `count` shrinks, so a removed-last chip or a clear-all never leaves focus pointing past the end.

### `CngxChipStripRovingOptions`

| Field | Type | Default | Purpose |
|-|-|-|-|
| `count` | `Signal<number>` | required | Reactive length of the chip list. Clamps `activeIndex` on shrink. |
| `container` | `Signal<HTMLElement \| null \| undefined>` | required | Strip host. Read lazily at `focusAt()` time, so view-init timing does not matter. `null` is a legitimate idle state and turns the controller into a no-op focuser. |
| `indexAttr` | `string` | `'data-reorder-index'` | Attribute used to locate each chip wrapper. Combined with the active index into a `[attr="index"]` query. Defaults align with `CngxReorder`'s own item contract. |

### `CngxChipStripRovingController`

| Member | Type | Purpose |
|-|-|-|
| `activeIndex` | `Signal<number>` | Current roving position. Clamped to `[0, count - 1]`; resets to `0` when `count` drops to `0`. |
| `markFocused(index)` | `(number) => void` | Wired on each chip wrapper's `(focus)`. Idempotent. Keeps `activeIndex` in sync with whatever the user's focus sequence did (mouse click, Tab into the strip). |
| `handleKeydown(event)` | `(KeyboardEvent) => void` | Container-level keydown handler. `ArrowLeft` / `ArrowRight` / `ArrowUp` / `ArrowDown` / `Home` / `End`. Events carrying `Ctrl` / `Alt` / `Meta` are ignored. |
| `focusAt(index)` | `(number) => void` | Sets `activeIndex` and focuses the matching chip. Used to restore focus after a reorder settles. |
| `setActive(index)` | `(number) => void` | Sets `activeIndex` without moving focus. Used during a reorder's transient pre-render phase where the DOM has not yet re-ordered the chips. |

### `CNGX_CHIP_STRIP_ROVING_FACTORY`

`InjectionToken<CngxChipStripRovingFactory>`, `providedIn: 'root'`. Defaults to `createChipStripRoving`. Override at any provider scope to install telemetry wrappers, a controlled-from-outside focus mode, or a custom keyboard policy without forking the consuming component.

```ts
providers: [
  { provide: CNGX_CHIP_STRIP_ROVING_FACTORY, useValue: myFactory },
]
```

Symmetrical to `CNGX_TREE_CONTROLLER_FACTORY` and `CNGX_SELECTION_CONTROLLER_FACTORY` in the same lib.

### Why not `CngxRovingTabindex`

`CngxRovingTabindex` uses a host `(keydown)` listener that does not gate on modifier keys. Co-located with `CngxReorder` on the same chip-strip element, it double-fires on `Ctrl+Arrow` / `Alt+Arrow` (the reorder emits, then roving also moves focus). `createChipStripRoving` deliberately skips modifier-pressed events so the paired reorder directive owns that gesture alone.

## Accessibility

The reorder directive emits, the consumer commits and restores focus. Move announcements belong to the composing component, not to this atom.

| Concern | Owner | Pattern |
|-|-|-|
| Focus restoration after a keyboard move | Consumer | After applying `event.next`, call `roving.focusAt(event.toIndex)` (or equivalent) inside `afterNextRender` so the DOM has settled. |
| Live-region announcement of the move | Consumer | Compute a sentence from `event.fromIndex` / `event.toIndex` / item label, push to an `aria-live="polite"` region. `CngxReorderableMultiSelect` wires this via its commit controller. |
| Drag-handle labelling | Consumer | Every handle element needs an accessible name (`aria-label="Move {{ item.label }}"` or visible text). The directive does not synthesise one. |
| Roving tabindex on the strip | `createChipStripRoving` | Exactly one chip has `tabindex="0"` at a time; all others are `-1`. Tab into the strip lands on `activeIndex`. |
| Modifier discoverability | Consumer | Document the shortcut near the strip or in an `aria-describedby` hint. `Alt+Arrow` is the default and the convention `CngxReorderableMultiSelect` exposes. |

Keyboard contract:

| Context | Key | Effect |
|-|-|-|
| Chip-strip container | `Tab` | Focus enters the strip at `activeIndex`. |
| Inside the strip | `ArrowLeft` / `ArrowRight` / `ArrowUp` / `ArrowDown` | Roving focus traversal. `activeIndex` updates. |
| Inside the strip | `Home` / `End` | Roving focus jumps to the ends. |
| Inside an item | `modifier + ArrowLeft` / `ArrowRight` / `ArrowUp` / `ArrowDown` | `reordered` emits with the new array. |
| Inside an item | `modifier + Home` / `End` | `reordered` emits with the item moved to the end. |
| During a pointer drag | `Escape` | Drag cancels without emission. |

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full input / output / signal surface.
- `CngxReorderableMultiSelect` in `@cngx/forms/select`: primary consumer, wires `CngxReorder` to a commit controller and the chip-strip roving factory into the multi-select trigger.
- Stories: `examples/stories/forms/select/reorderable-multi-select/`.
