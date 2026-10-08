import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { CngxFormField } from '@cngx/forms/field';
import { afterEach, describe, expect, it } from 'vitest';
import { CngxRating } from './rating.component';

@Component({
  selector: 'rating-touched-host',
  template: `<cngx-form-field [field]="f.score"><cngx-rating /></cngx-form-field>`,
  imports: [CngxRating, CngxFormField],
})
class FieldHost {
  readonly model = signal({ score: 0 });
  readonly f = form(this.model);
}

function flush(fixture: ComponentFixture<unknown>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

function mount() {
  const fixture = TestBed.createComponent(FieldHost);
  document.body.appendChild(fixture.nativeElement);
  flush(fixture);
  const buttons = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="radio"]'),
  );
  return { fixture, buttons, host: fixture.componentInstance };
}

function leave(
  from: HTMLElement,
  to: HTMLElement | null,
  fixture: ComponentFixture<unknown>,
): void {
  from.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: to }));
  flush(fixture);
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('CngxRating touched inside cngx-form-field', () => {
  it('harness sanity: the rating mounts and a click sets the model', () => {
    const { fixture, buttons, host } = mount();

    buttons[2].click();
    flush(fixture);

    expect(host.model().score).toBe(3);
  });

  it('R1: moving focus between stars leaves the field untouched', () => {
    const { fixture, buttons, host } = mount();

    leave(buttons[0], buttons[1], fixture);

    expect(host.f.score().touched()).toBe(false);
  });

  it('R2: focus leaving the rating marks the field touched', () => {
    const { fixture, buttons, host } = mount();

    leave(buttons[0], null, fixture);

    expect(host.f.score().touched()).toBe(true);
  });
});
