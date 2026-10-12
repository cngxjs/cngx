import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, min, required, schema, type FieldTree } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { focusFirstError } from './focus-first-error';

interface Booking {
  fullName: string;
  email: string;
  seats: number;
}

@Component({
  selector: 'focus-first-error-host',
  template: `
    <input id="full-name" [formField]="booking.fullName" />
    <input id="email" [formField]="booking.email" />
    <input id="seats" type="number" [formField]="booking.seats" />
  `,
  imports: [FormField],
})
class BookingHost {
  readonly model = signal<Booking>({ fullName: '', email: '', seats: 0 });
  readonly booking = form(
    this.model,
    schema<Booking>((root) => {
      required(root.fullName);
      required(root.email);
      min(root.seats, 1);
    }),
  );

  // Type-level contract: a typed form tree is accepted without a cast. If the
  // parameter narrows again, this call stops compiling and the spec fails.
  focusFirst(): boolean {
    return focusFirstError(this.booking);
  }
}

function render(): { host: BookingHost; el: HTMLElement } {
  const fixture = TestBed.createComponent(BookingHost);
  fixture.autoDetectChanges();
  document.body.appendChild(fixture.nativeElement);
  return { host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

describe('focusFirstError', () => {
  it('accepts a typed form tree and rejects a non-tree argument', () => {
    // Generic over the model: consumers compiled without strictNullChecks
    // could not pass a typed tree to a FieldTree<unknown> parameter.
    const typed: (tree: FieldTree<Booking>) => boolean = focusFirstError<Booking>;
    expect(typed).toBe(focusFirstError);
    // @ts-expect-error a plain value is not a field tree
    expect(() => focusFirstError({ fullName: '' })).toThrow();
  });

  it('focuses the first invalid bound control in form order', () => {
    const { host, el } = render();
    expect(host.focusFirst()).toBe(true);
    expect(document.activeElement).toBe(el.querySelector('#full-name'));

    host.model.update((m) => ({ ...m, fullName: 'Ada' }));
    TestBed.tick();
    expect(host.focusFirst()).toBe(true);
    expect(document.activeElement).toBe(el.querySelector('#email'));
  });

  it('returns false when the form has no errors', () => {
    const { host } = render();
    host.model.set({ fullName: 'Ada', email: 'ada@example.com', seats: 2 });
    TestBed.tick();
    expect(host.focusFirst()).toBe(false);
  });
});
