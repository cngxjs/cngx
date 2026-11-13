import { isObservable, map, type Observable } from 'rxjs';

/** The async action shape the demo stories bind: a Promise or an Observable factory. */
export type DemoAction = (signal?: AbortSignal) => Promise<unknown> | Observable<unknown>;

function readMember<F>(host: object, key: string): F {
  const member: unknown = Reflect.get(host, key);
  if (typeof member !== 'function') {
    throw new TypeError(`Demo chrome: "${key}" is not a function on the story component.`);
  }
  return member.bind(host) as F;
}

/**
 * Demo chrome: replaces the function an artifact member holds (an async
 * action field by default, or a handler method) with `wrap(original)`, so
 * the chrome can change its latency or outcome, or count its calls, while
 * the artifact code in `setup` stays copyable on its own. Call it from a
 * `setupChrome` field initializer: the `setup` fields are initialised first,
 * and the template reads the member after construction.
 */
export function wrapDemoAction<F extends (...args: never[]) => unknown = DemoAction>(
  host: object,
  key: string,
  wrap: (original: F) => F,
): void {
  Reflect.set(host, key, wrap(readMember<F>(host, key)));
}

/**
 * Demo chrome: makes the artifact action `key` fail with `error()` while
 * `when()` is true. The original action still runs for its full time and
 * `when()` is read when it settles, so a fail switch flipped mid-run decides
 * that run, as it would with a real backend.
 */
export function failDemoActionWhen(
  host: object,
  key: string,
  when: () => boolean,
  error: () => unknown,
): void {
  const check = <T>(value: T): T => {
    if (when()) {
      throw error();
    }
    return value;
  };
  wrapDemoAction(host, key, (original) => (signal) => {
    const result = original(signal);
    return isObservable(result) ? result.pipe(map(check)) : result.then(check);
  });
}
