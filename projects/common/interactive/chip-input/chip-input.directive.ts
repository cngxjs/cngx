import {
  Directive,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  buildAsyncStateView,
  CNGX_STATEFUL,
  type AsyncStatus,
  type CngxAsyncState,
  type CngxStateful,
} from '@cngx/core/utils';
import { firstValueFrom, isObservable, type Observable } from 'rxjs';

/**
 * Tokenizing input that turns user-entered strings into emitted
 * `tokenCreated` events on separator keys (default: comma + Enter)
 * and on multi-token paste. Pairs naturally with
 * `<cngx-multi-chip-group>` or any consumer-managed chip list.
 *
 * **Validation slot — async-state producer.** The directive provides
 * `CNGX_STATEFUL` via `useExisting`, exposing a
 * `ManualAsyncState<string>` slot driven by `[validateToken]`
 * invocations. Bridge directives (`<cngx-toast-on />`,
 * `<cngx-banner-on />`) auto-discover this slot through the
 * `CNGX_STATEFUL` token without an explicit `[state]` input wiring.
 *
 * State machine: `idle → pending → success | error` per separator-key
 * invocation. Concurrent validations supersede via a monotonic
 * `validationId` — when a second token is entered before the first
 * resolves, the first's resolution is dropped and only the latest
 * outcome touches the slot. Mirrors `createCommitController`'s
 * supersede contract.
 *
 * **Removal contract.** `(tokenRemoved)` fires on Backspace at empty
 * input — semantically "user wants to remove the last chip". The
 * directive does not own the chip list; the consumer drops the last
 * entry from their state in response.
 *
 * **Duplicates.** `[existingTokens]` is read on every separator-key
 * invocation; when `allowDuplicates` is `false` (default), a token
 * already present in the list is silently dropped. The directive
 * does not track a private "previously emitted" set — that would be
 * an unbounded memory leak. Consumers pass their canonical chip
 * list as `[existingTokens]`.
 *
 * **Paste.** Pasting text containing one or more single-character
 * separators (e.g. `"red, green, blue"`) emits one `tokenCreated`
 * per non-empty fragment. Multi-char separators (`'Enter'`) are
 * keyboard-only and ignored by the paste path. Single-token paste
 * (no embedded separator) is left to the default paste behaviour
 * so the input value populates normally and the user can decide.
 *
 * @example
 * ```html
 * <input
 *   cngxChipInput
 *   placeholder="Type a tag and press Enter"
 *   [existingTokens]="tags()"
 *   (tokenCreated)="addTag($event)"
 *   (tokenRemoved)="popTag()"
 *   [validateToken]="validateTag"
 * />
 * <cngx-toast-on />
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'input[cngxChipInput]',
  exportAs: 'cngxChipInput',
  standalone: true,
  host: {
    class: 'cngx-chip-input',
    '[attr.aria-busy]': 'isPending() ? "true" : null',
    '[attr.aria-invalid]': 'isInvalid() ? "true" : null',
    '(keydown)': 'handleKeydown($event)',
    '(paste)': 'handlePaste($event)',
  },
  providers: [{ provide: CNGX_STATEFUL, useExisting: CngxChipInput }],
})
export class CngxChipInput implements CngxStateful<string> {
  readonly separators = input<readonly string[]>([',', 'Enter']);
  readonly allowDuplicates = input<boolean>(false);
  readonly trimWhitespace = input<boolean>(true);
  readonly existingTokens = input<readonly string[]>([]);
  readonly validateToken = input<
    ((value: string) => Promise<string> | Observable<string>) | undefined
  >(undefined);

  readonly tokenCreated = output<string>();
  readonly tokenRemoved = output<void>();
  readonly validationError = output<unknown>();

  private readonly statusState = signal<AsyncStatus>('idle');
  private readonly dataState = signal<string | undefined>(undefined);
  private readonly errorState = signal<unknown>(undefined);
  private readonly hadSuccess = signal(false);

  /**
   * Validation slot — `CngxStateful<string>` contract surface. The
   * view is built from raw signals via `buildAsyncStateView` rather
   * than `createManualState` (which lives in `@cngx/common/data`)
   * because `@cngx/common/data → @cngx/common/interactive` already
   * exists via `CngxSearch`, and re-importing data from interactive
   * would create a circular package dependency. The 30-LOC inline
   * is acceptable scope-wise; a future refactor relocating
   * `createManualState` to `@cngx/core/utils` would let this
   * collapse to a single call.
   */
  readonly state: CngxAsyncState<string> = buildAsyncStateView<string>({
    status: this.statusState.asReadonly(),
    data: this.dataState.asReadonly(),
    error: this.errorState.asReadonly(),
    progress: signal<number | undefined>(undefined).asReadonly(),
    isFirstLoad: computed(() => !this.hadSuccess()),
    lastUpdated: signal<Date | undefined>(undefined).asReadonly(),
  });

  private readonly hostEl = inject<ElementRef<HTMLInputElement>>(ElementRef)
    .nativeElement;
  private validationId = 0;

  protected readonly isPending = computed(
    () => this.state.status() === 'pending',
  );
  protected readonly isInvalid = computed(
    () => this.state.status() === 'error',
  );

  protected handleKeydown(event: KeyboardEvent): void {
    if (this.separators().includes(event.key)) {
      event.preventDefault();
      const raw = this.hostEl.value;
      this.hostEl.value = '';
      this.createToken(raw);
      return;
    }
    if (event.key === 'Backspace' && this.hostEl.value === '') {
      this.tokenRemoved.emit();
    }
  }

  protected handlePaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text');
    if (text === undefined || text === '') {
      return;
    }
    const charSeps = this.separators().filter((s) => s.length === 1);
    if (charSeps.length === 0) {
      return;
    }
    const escaped = charSeps.map(escapeForCharClass).join('');
    const splitter = new RegExp(`[${escaped}]`);
    const fragments = text.split(splitter).filter((f) => f.length > 0);
    if (fragments.length <= 1) {
      return;
    }
    event.preventDefault();
    this.hostEl.value = '';
    for (const fragment of fragments) {
      this.createToken(fragment);
    }
  }

  private createToken(rawValue: string): void {
    const trimmed = this.trimWhitespace() ? rawValue.trim() : rawValue;
    if (trimmed === '') {
      return;
    }
    if (!this.allowDuplicates() && this.existingTokens().includes(trimmed)) {
      return;
    }

    const validate = this.validateToken();
    if (validate === undefined) {
      this.tokenCreated.emit(trimmed);
      return;
    }

    const id = ++this.validationId;
    this.statusState.set('pending');

    void this.runValidation(validate, trimmed, id);
  }

  private async runValidation(
    validate: (value: string) => Promise<string> | Observable<string>,
    value: string,
    id: number,
  ): Promise<void> {
    try {
      const result = validate(value);
      const accepted: string = isObservable(result)
        ? await firstValueFrom(result)
        : await result;
      if (id !== this.validationId) {
        return;
      }
      this.dataState.set(accepted);
      this.errorState.set(undefined);
      this.hadSuccess.set(true);
      this.statusState.set('success');
      this.tokenCreated.emit(accepted);
    } catch (err) {
      if (id !== this.validationId) {
        return;
      }
      this.errorState.set(err);
      this.statusState.set('error');
      this.validationError.emit(err);
    }
  }
}

/**
 * Escape a single character for safe inclusion inside a regex
 * character class `[...]`. Unlike general-context escaping, the
 * meta set is narrower (`\`, `]`, `^`, `-`) but `^` and `-` matter
 * because they would otherwise act as character-class operators
 * (negation at position 0, range between siblings) and silently
 * change the splitter's behaviour for separators like `'-'` or
 * `'^'`. Always-escaping these four is safe inside `[...]`.
 */
function escapeForCharClass(value: string): string {
  return value.replace(/[\\\]\-^]/g, '\\$&');
}
