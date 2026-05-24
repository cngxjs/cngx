import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, filter } from 'rxjs';
import { type KeyCombo, matchesKeyCombo, parseKeyCombo } from '@cngx/core/utils';

/** Input element tag names where global shortcuts should not fire. */
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Declarative keyboard shortcut handler.
 *
 * Binds a keyboard shortcut to the host element without global event listeners
 * in a service. Supports `mod` as a platform-aware modifier (`Meta` on macOS,
 * `Ctrl` elsewhere).
 *
 * Two scopes: `'global'` (default) listens on `document` and ignores events
 * from input elements; `'self'` listens only on the host element.
 *
 * Uses `parseKeyCombo` and `matchesKeyCombo` from `@cngx/core/utils`.
 *
 * ### Global save shortcut
 * ```html
 * <button [cngxKeyboardShortcut]="'mod+s'" (shortcutTriggered)="save()">
 *   Save
 * </button>
 * ```
 *
 * ### Scoped escape handler
 * ```html
 * <div [cngxKeyboardShortcut]="'escape'" [shortcutScope]="'self'"
 *      (shortcutTriggered)="close()" tabindex="0">
 *   Press Escape to close
 * </div>
 * ```
 * <example-url>http://localhost:4200/#/common/interactive/gestures/keyboard-shortcut/global-shortcut</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/gestures/keyboard-shortcut/self-scoped-shortcut</example-url>
 */
@Directive({
  selector: '[cngxKeyboardShortcut]',
  exportAs: 'cngxKeyboardShortcut',
  standalone: true,
})
export class CngxKeyboardShortcut {
  /** Shortcut combo string, e.g. `'mod+s'`, `'ctrl+shift+k'`, `'escape'`. */
  readonly shortcut = input.required<string>({ alias: 'cngxKeyboardShortcut' });
  /** `'global'` listens on document; `'self'` listens only on the host element. */
  readonly scope = input<'global' | 'self'>('global', { alias: 'shortcutScope' });
  /** Whether the shortcut is active. */
  readonly enabled = input<boolean>(true);

  /** Emitted when the shortcut fires. */
  readonly shortcutTriggered = output<KeyboardEvent>();

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const doc = inject(DOCUMENT);
    const isMac = doc.defaultView ? /mac/i.test(doc.defaultView.navigator.platform) : false;

    // Both streams stay subscribed; scope() gates inside the filter so
    // toggling scope at runtime doesn't churn subscriptions.
    const globalKeydown$ = fromEvent<KeyboardEvent>(doc, 'keydown');
    const selfKeydown$ = fromEvent<KeyboardEvent>(el, 'keydown');

    globalKeydown$
      .pipe(
        filter(() => this.enabled() && this.scope() === 'global'),
        filter((event) => !this.isInputElement(event.target)),
        filter((event) => this.matchesShortcut(event, isMac)),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        event.preventDefault();
        this.shortcutTriggered.emit(event);
      });

    selfKeydown$
      .pipe(
        filter(() => this.enabled() && this.scope() === 'self'),
        filter((event) => this.matchesShortcut(event, isMac)),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        event.preventDefault();
        this.shortcutTriggered.emit(event);
      });
  }

  /** Tests the keyboard event against the current shortcut combo. */
  private matchesShortcut(event: KeyboardEvent, isMac: boolean): boolean {
    const combo = this.parseCurrentCombo();
    return combo !== null && matchesKeyCombo(event, combo, isMac);
  }

  private parsedCombo: KeyCombo | null = null;
  private parsedComboStr = '';

  /** Parses the shortcut string, memoising the result to avoid re-parsing on every keystroke. */
  private parseCurrentCombo(): KeyCombo | null {
    const str = this.shortcut();
    if (str !== this.parsedComboStr) {
      this.parsedComboStr = str;

      this.parsedCombo = parseKeyCombo(str);
    }
    return this.parsedCombo;
  }

  /**
   * Guards global shortcuts from firing when the user is typing in a form field
   * or contenteditable region. Self-scoped shortcuts skip this check.
   */
  private isInputElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) {
      return false;
    }
    return INPUT_TAGS.has(target.tagName) || target.isContentEditable;
  }
}
