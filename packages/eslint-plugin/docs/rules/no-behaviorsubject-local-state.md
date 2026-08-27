# no-behaviorsubject-local-state

Disallow `BehaviorSubject`/`Subject` fields for local component state.

Local state on a `@Component`/`@Directive` belongs in a `signal()`; a Subject
field is manually managed state the reactive graph cannot derive from. The rule
flags `new BehaviorSubject(...)` and `new Subject(...)` field initializers on
component and directive classes only - services keeping genuine RxJS streams
are untouched.

## Invalid

```ts
@Component({ /* ... */ })
class Panel {
  private open$ = new BehaviorSubject(false);
}
```

## Valid

```ts
@Component({ /* ... */ })
class Panel {
  private readonly open = signal(false);
}

@Injectable()
class Bus {
  readonly events$ = new Subject<Event>(); // service stream - out of scope
}
```

## Fix

Replace the Subject field with a `signal()`; derive dependent values with
`computed()`.

## Configuration

Category `signal-hygiene`. `error` in `recommended` and `all`. No options.
