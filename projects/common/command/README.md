# @cngx/common/command - Headless Command Registry

A typed command model and a DI registry that app parts contribute to, with a
swappable ranking strategy. Zero rendered chrome. This is the base the
`@cngx/ui/command-palette` preset renders; register commands here and either
take that preset or build your own surface.

## This Is a Registry, Not a UI

`@cngx/common/command` holds `CngxCommand` payloads and merges them into one
reactive signal. It draws nothing. A consumer registers commands against it
without pulling in any component, then feeds the merged signal to a surface -
the shipped Cmd/Ctrl+K palette (`@cngx/ui/command-palette`), or a bespoke one.

| | `@cngx/common/command` | `@cngx/ui/command-palette` |
|-|-|-|
| Level | 2 (atoms/DI, no chrome) | 4 (organism, renders `<cngx-dialog>`) |
| Owns | command model, sources, matcher | the Cmd/Ctrl+K dialog, slots, config |
| Ships | data + DI tokens | a rendered preset |
| Depends on | `@cngx/core/utils` only | this + `common/interactive` + `dialog` + ... |

Split on purpose: register against the base without the preset's weight; the
preset is one opinionated way to render it, not the only way.

## Register Commands

`provideCommands(...)` returns `Provider[]`, so it registers at any injector
scope - app root, a lazy route, or a component's `providers` / `viewProviders`.
App parts contribute sets without a central list, and `injectCommands()` merges
them.

```typescript
// app root
bootstrapApplication(AppComponent, {
  providers: [provideCommands(FILE_COMMANDS)],
});

// or scoped to a route / component
@Component({
  viewProviders: [provideCommands(EDITOR_COMMANDS)],
})
export class EditorView {}
```

A source is either a static list or a reactive `Signal` - a signal source lets a
contributor add, remove, or disable commands live:

```typescript
const commands = signal<CngxCommand[]>([saveCmd]);
provideCommands(commands); // injectCommands() tracks it

// later, from anywhere:
commands.update((list) => [...list, publishCmd]);
```

## Read Them

```typescript
private readonly commands = injectCommands();
// Signal<readonly CngxCommand[]> - every provideCommands source, merged.
```

The merge carries an explicit `equal` (length + per-command identity), so
re-emitting the same set does not produce a fresh array and cascade downstream
`computed()`s. Re-providing identical references is a no-op.

## The Command Model

```typescript
export interface CngxCommand {
  readonly id: string;                 // stable identity; drives the merge equal
  readonly label: string;              // primary match target
  readonly keywords?: readonly string[];
  readonly group?: string;             // also the matcher's scope-filter key
  readonly icon?: string;              // token; your row template resolves it
  run(): void | Promise<void>;
  readonly disabled?: Signal<boolean>; // reactive; stays perceivable
  readonly disabledReason?: string;    // the why (Pillar 2 - surfaced via aria-describedby)
  readonly data?: unknown;             // consumer payload, narrowed at the row slot
}
```

`data` is `unknown` on purpose: a command list is heterogeneous, so there is no
`CngxCommand<T>` type parameter. Narrow `data` where you render the row.

Commands cluster into groups for the result surface:

```typescript
export interface CommandGroup {
  readonly id: string;
  readonly label: string;
  readonly commands: readonly CngxCommand[];
}
```

## Match Strategy

Ranking sits behind a swappable factory token. The default is a pure
label/keyword ranker; there is no fuzzy engine in the bundle - drop one in
without touching any surface.

```typescript
// default: label-exact > label-prefix > label-substring > keyword; scope filters by group
const match = inject(CNGX_COMMAND_MATCH_FACTORY)();
const ranked = match(commands(), term(), scope()); // RankedCommand[]
```

Swap it app-wide (or per-component via `viewProviders`):

```typescript
providers: [
  {
    provide: CNGX_COMMAND_MATCH_FACTORY,
    useValue: () => (commands, term) => fuzzyRank(commands, term), // your engine
  },
];
```

`CngxCommandMatcher` is `(commands, term, scope?) => readonly RankedCommand[]`;
each `RankedCommand` is `{ command, score }` (higher scores rank first, `0` for
an empty query).

## Render Them

The registry draws nothing. Feed it to a surface:

```html
<!-- the shipped preset: @cngx/ui/command-palette -->
<cngx-command-palette />
```

```typescript
providers: [provideCommands(APP_COMMANDS)];
// Cmd/Ctrl+K opens; type-to-filter runs the matcher over the merged registry.
```

The preset owns the dialog, keyboard model, ARIA, theming, config cascade, and
slot overrides. See the live demos at `/ui/command-palette/basic` and
`/ui/command-palette/custom-row`. To build your own surface, read
`injectCommands()`, run a `CNGX_COMMAND_MATCH_FACTORY` matcher over it in a
`computed()`, and render the result.

## Exports

| Symbol | Kind | Purpose |
|-|-|-|
| `CngxCommand` | interface | the command model |
| `CommandGroup` | interface | a named cluster of commands |
| `CngxCommandSource` | type | a static list or a `Signal` of commands |
| `provideCommands(...sources)` | `Provider[]` | register sources at any injector scope |
| `injectCommands()` | `Signal<readonly CngxCommand[]>` | merged, `equal`-guarded registry |
| `CNGX_COMMAND_SOURCE` | multi token | what `provideCommands` contributes to |
| `createDefaultCommandMatcher()` | factory | the pure label/keyword ranker |
| `CngxCommandMatcher` | type | `(commands, term, scope?) => RankedCommand[]` |
| `RankedCommand` | interface | `{ command, score }` |
| `CNGX_COMMAND_MATCH_FACTORY` | token | swap the ranker (providedIn `'root'`) |
| `CngxCommandMatchFactory` | type | the factory shape |
