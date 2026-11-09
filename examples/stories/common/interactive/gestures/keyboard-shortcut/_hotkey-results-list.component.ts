import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { type CngxHotkeyBinding, injectHotkeys } from '@cngx/common/interactive';

/**
 * Demo fixture for the `registry-scopes` story: a result list whose `n` / `p`
 * bindings use `reach: 'focus'`, so they fire only while focus is inside the
 * nearest `[cngxHotkeyScope]`.
 *
 * Internal demo fixture only - not part of any published bundle.
 */
@Component({
  selector: 'demo-hotkey-results-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul style="list-style:none;margin:0;padding:0;display:grid;gap:4px">
      @for (item of items; track item; let i = $index) {
        <li>
          <button
            type="button"
            class="chip"
            [class.chip--active]="i === active()"
            [attr.aria-current]="i === active() ? 'true' : null"
            aria-keyshortcuts="N P"
            (focus)="active.set(i)"
          >
            {{ item }}
          </button>
        </li>
      }
    </ul>
  `,
})
export class HotkeyResultsList {
  readonly fired = output<string>();

  protected readonly items = ['Invoice 1042', 'Invoice 1043', 'Invoice 1044', 'Invoice 1045'];
  protected readonly active = signal(0);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    injectHotkeys(
      signal<readonly CngxHotkeyBinding[]>([
        {
          id: 'results.next',
          combo: 'n',
          description: 'Next result',
          reach: 'focus',
          run: () => this.move(1, 'results.next'),
        },
        {
          id: 'results.previous',
          combo: 'p',
          description: 'Previous result',
          reach: 'focus',
          run: () => this.move(-1, 'results.previous'),
        },
      ]).asReadonly(),
    );
  }

  private move(step: number, id: string): void {
    const next = (this.active() + step + this.items.length) % this.items.length;
    this.active.set(next);
    this.host.querySelectorAll('button')[next]?.focus();
    this.fired.emit(id);
  }
}
