<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Lint Rules

<aside class="cc-tldr">

`@cngx/eslint-plugin` turns the CNGX signal idioms and wiring contracts into six ESLint rules for consumer apps. Static, per-file, no LLM. Spread `configs.recommended` into your flat config and the five hard rules run at `error`; `configs.all` adds the advisory `untracked-in-effect` at `warn`.

</aside>

Most CNGX conventions are easy to state and easy to break: an `effect()` written in
`ngOnInit`, local state kept in a `BehaviorSubject`, a menu trigger without its popover
anchor. Each mistake compiles. Some throw at runtime, some fail silently, some only
show up as a panel stuck in the top-left corner. The plugin catches the ones a single
file can prove, at lint time, with the same verdict every run.

It is plain static analysis. Every rule reads one file's AST and nothing else: no type
checker, no project graph, no runtime dependency on any `@cngx/*` package, no model in
the loop. That boundary decides what belongs here. A check that needs to see the whole
project (a provider registered somewhere else, a stylesheet imported by some entry
point) belongs to `@cngx/doctor` instead; see [Relation to `@cngx/doctor`](#relation-to-cngxdoctor).

|Rule|Category|`recommended`|`all`|
|-|-|-|-|
|`no-effect-in-ngoninit`|signal hygiene|error|error|
|`no-behaviorsubject-local-state`|signal hygiene|error|error|
|`model-for-two-way`|wiring|error|error|
|`no-required-on-bridge-input`|wiring|error|error|
|`menu-trigger-needs-popover-anchor`|wiring|error|error|
|`untracked-in-effect`|opt-in|off|warn|

---

## Install

```bash
npm i -D @cngx/eslint-plugin
```

The plugin needs ESLint 9 or later and a flat config. It declares two peer
dependencies: `eslint` (`>=9`) and `@angular-eslint/template-parser` (`>=19`), which the
template rule uses. Every Angular project that lints templates already has the parser.
The TypeScript rules run under whatever TypeScript parser your config already sets up
(`typescript-eslint`, `@typescript-eslint/parser`, or `angular-eslint`).

`ng add` wires all of this for you when the app has a flat config: it adds the
devDependency and spreads `configs.recommended` into the exported array. See
[Install](install.md) for the cases it cannot wire and the note it leaves instead.

### Flat config

CommonJS:

```js
// eslint.config.js
const cngx = require('@cngx/eslint-plugin');

module.exports = [...cngx.configs.recommended];
```

ESM:

```js
// eslint.config.mjs
import cngx from '@cngx/eslint-plugin';

export default [...cngx.configs.recommended];
```

The package resolves to the plugin object under both `require` and an ESM default
import, so the two forms are interchangeable.

### `recommended` and `all`

Both configs are arrays of two blocks, so spread them rather than nesting them:

- `cngx/rules` registers the plugin and turns on the TypeScript rules. It sets no
  `files`, so the rules apply wherever your own TypeScript parser runs.
- `cngx/templates` targets `**/*.html`, sets `@angular-eslint/template-parser` as the
  parser, and turns on the template rule.

`recommended` turns on every rule whose recommended severity is not `off`: the five
hard rules at `error`. `all` is the same plus `untracked-in-effect`, lifted from `off`
to `warn`. Severities are derived from one place, the rule metadata, so the two
configs cannot drift from the table above.

### A single rule

To run one rule without a config, register the plugin under the `cngx` namespace and
name the rule:

```js
export default [
  {
    plugins: { cngx: require('@cngx/eslint-plugin') },
    rules: { 'cngx/no-effect-in-ngoninit': 'error' },
  },
];
```

The same shape overrides a severity from `recommended`: add a block after the spread
that sets the rule to the level you want.

---

## Signal hygiene

These two rules hold the line between signal state and everything else. Both enforce
[Pillar 1](three-pillars.md), derivation over management: state lives in signals, and
every derived value is computed from it rather than synced by hand.

### `no-effect-in-ngoninit`

Flags an `effect()` call inside `ngOnInit`, in both the method form and the arrow-field
form of the hook.

`effect()` resolves its `Injector` from the injection context. The constructor and field
initializers run inside one; `ngOnInit` runs after it has closed, so the call throws
`NG0203` at runtime. The rule turns that runtime error into a lint error. See
[Effect rules](signal-first-internals.md#effect-rules).

```ts
// flagged
@Component({ /* ... */ })
class Panel {
  ngOnInit() {
    effect(() => this.sync());
  }
}

// fine
@Component({ /* ... */ })
class Panel {
  constructor() {
    effect(() => this.sync());
  }
}
```

A field initializer (`readonly sync = effect(() => ...)`) is equally valid. No options.

### `no-behaviorsubject-local-state`

Flags a `new BehaviorSubject(...)` or `new Subject(...)` field initializer on a class
decorated with `@Component` or `@Directive`.

A Subject field is state you manage by hand: you push into it, subscribe to it, and
keep everything that depends on it in sync yourself. A `signal()` puts the same value in
the reactive graph, where `computed()` derives from it and templates read it without a
subscription. RxJS stays at the boundary (HTTP, WebSockets, DOM streams), which is why
services are out of scope: an `@Injectable` or an undecorated class keeping a genuine
stream is not flagged. See [RxJS at the boundary](signal-first-internals.md#rxjs-at-the-boundary).

```ts
// flagged
@Component({ /* ... */ })
class Panel {
  private open$ = new BehaviorSubject(false);
}

// fine
@Component({ /* ... */ })
class Panel {
  private readonly open = signal(false);
}

@Injectable()
class Bus {
  readonly events$ = new Subject<Event>(); // service stream, out of scope
}
```

Only direct `BehaviorSubject` and `Subject` constructions in a field initializer count.
No options.

---

## Wiring

These rules guard contracts between CNGX parts and between a component and its
consumer. Each one catches a shape that compiles and looks reasonable, but breaks the
contract the shape is supposed to express.

### `model-for-two-way`

Flags an `input()` or `input.required()` field `x` on a class that also declares an
`output()` field named `xChange`.

The pair compiles and even supports the `[(x)]` banana-in-a-box syntax, but it spreads
one value over two declarations and loses the single writable signal `model()` gives
you. CNGX makes every two-way bindable atom a `model()`. See
[`model<T>()` for two-way bindable atoms](signal-first-internals.md#inputs-and-outputs).

```ts
// flagged
class Pager {
  readonly page = input(0);
  readonly pageChange = output<number>();
}

// fine
class Pager {
  readonly page = model(0);
}
```

The rule pairs on the declared field names. Bindings renamed through `alias` are out of
scope. No options.

### `no-required-on-bridge-input`

Flags every `input.required()` field on a class whose field initializers inject a
bridge fallback token, `CNGX_STATEFUL` by default.

A bridge directive reads its state from an input, and falls back to the injected token
when no input is bound. `input.required()` breaks that path: the template now demands a
binding the fallback exists to make unnecessary. Bridge inputs stay optional, with a
transform that turns the empty string of a bare attribute into `undefined`. This is the
bridge-input rule from [Pillar 3](three-pillars.md) and
[`input.required<T>()` only when the consumer must provide](signal-first-internals.md#inputs-and-outputs).

```ts
// flagged
class SortBridge {
  private readonly state = inject(CNGX_STATEFUL, { optional: true });
  readonly sortRef = input.required<CngxSort>();
}

// fine
class SortBridge {
  private readonly state = inject(CNGX_STATEFUL, { optional: true });
  readonly sortRef = input<CngxSort | undefined, CngxSort | '' | undefined>(undefined, {
    transform: (v) => (typeof v === 'string' ? undefined : v),
  });
}
```

The trigger is the token name, not the `optional` flag. A class that injects some other
optional token (a config token, an optional ancestor) is not a bridge, and its required
data inputs are left alone. Inside a bridge class every `input.required()` is flagged:
the rule cannot tell the bridge input from a data input statically, and a bridge atom's
inputs are its bridge surface by design.

If your app has its own fallback tokens, list them with the `tokens` option. The list
replaces the default, so keep `CNGX_STATEFUL` in it:

```js
'cngx/no-required-on-bridge-input': ['error', { tokens: ['CNGX_STATEFUL', 'MY_BRIDGE_TOKEN'] }]
```

|Option|Type|Default|Meaning|
|-|-|-|-|
|`tokens`|`string[]`|`['CNGX_STATEFUL']`|Fallback token names that mark a class as a bridge.|

### `menu-trigger-needs-popover-anchor`

Flags a template element that carries `cngxMenuTrigger`, as a plain attribute or a bound
input, without `cngxPopoverTrigger` on the same element. This is the one template rule;
it runs on `**/*.html` under the Angular template parser.

`CngxMenuTrigger` wires the menu behavior only and sets no CSS anchor. A menu panel
rendered into a popover positions against the anchor `cngxPopoverTrigger` establishes.
Without it the panel opens unanchored, at the top-left of the viewport. Splitting the
two is deliberate composition ([Pillar 3](three-pillars.md)): each directive owns one
responsibility, and the rule makes sure you compose both.

```html
<!-- flagged -->
<button cngxMenuTrigger [menuPanel]="panel">Open</button>

<!-- fine -->
<button cngxMenuTrigger cngxPopoverTrigger [menuPanel]="panel">Open</button>
```

Detection stops at same-element co-presence. Proving which popover a trigger opens would
need cross-element reference resolution and would produce false positives, and every
menu trigger that opens a popover needs the anchor anyway. No options.

---

## Opt-in

### `untracked-in-effect`

Flags a call rooted at `this` (`this.toaster.show(...)`, `this.store.load()`) inside an
`effect()` callback that is not wrapped in `untracked()`.

Service methods read signals internally: dedup flags, queues, their own state. Called
from an effect without `untracked()`, every one of those reads becomes a dependency of
the effect, so the effect re-fires on the callee's own state changes. That is the
reactive loop that freezes a tab. Wrapping the call keeps the effect subscribed only to
what it reads directly. See [Untracked](signal-first-internals.md#untracked).

```ts
// flagged
class Panel {
  constructor() {
    effect(() => {
      const status = this.status();
      this.toaster.show(status); // subscribes the effect to the toaster's internals
    });
  }
}

// fine
class Panel {
  constructor() {
    effect(() => {
      const status = this.status();
      untracked(() => this.toaster.show(status));
    });
  }
}
```

#### Why it is advisory

From the AST alone, `this.status()` and `this.toaster.show()` look the same: a
`this`-rooted call. One is a signal read the effect must track, the other a service call
it must not. Without a type checker the rule cannot tell them apart, so it narrows
rather than proves, and a rule that cannot prove its finding does not belong at `error`
in `recommended`. It ships in `all` at `warn`.

It narrows in three ways:

- A zero-argument, single-level call (`this.x()`) is skipped when the class declares `x`
  with a signal factory: `signal`, `computed`, `input`, `model`, `linkedSignal`,
  `viewChild`, `viewChildren`, `contentChild`, `contentChildren`, or the `.required`
  form of one of them. Signals passed in from elsewhere are not recognised and still
  warn.
- A class named `CngxAsyncContainer` is skipped. The exception matches by name and
  exists for the CNGX organism of that name.
- A `cngx-allow-effect-writes` comment silences it: before the `effect()` call, before
  the class, or anywhere inside the class body. A marker inside the class covers every
  effect in that class.

Treat a warning as a prompt to look, not a verdict. If the call is a service call, wrap
it. If it is a signal read the rule could not recognise, the marker documents that you
checked. No options.

---

## The metadata seam

Every rule's id, category, AST surface (`ts` or `template`), message catalogue, fix
hint, and recommended severity live in one dependency-free module, published as its own
entry point:

```js
const { RULE_METADATA } = require('@cngx/eslint-plugin/metadata');
```

The module imports nothing, so tooling can explain a lint finding without loading the
ESLint runtime. The rules take their messages from it, and both configs take their
severities from it, which is why a lint report, the configs, and any tool reading the
seam always agree.

---

## Relation to `@cngx/doctor`

The two tools split one job by scope. The plugin owns what a single file can decide.
`@cngx/doctor` owns project wiring: checks such as a feedback surface used without its
root opt-in, which need a whole-project view no per-file rule has. The doctor keeps its
check metadata in the same record shape as `RULE_METADATA`, so a doctor finding and a
lint finding read the same way.

The agents and skills cite the id of a finding either tool owns and defer the verdict to
it. See [The mechanical layer](agent-tooling.md#the-mechanical-layer) in Agent Tooling
for how the agents route to both.
