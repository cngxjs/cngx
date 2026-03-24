import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxInputClear } from './input-clear.directive';

@Component({
  template: `
    <input #nameInput value="hello" />
    <button [cngxInputClear]="nameInput" #clr="cngxInputClear">Clear</button>
  `,
  imports: [CngxInputClear],
})
class Host {
  readonly directive = viewChild.required(CngxInputClear);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, input, button, directive };
}

describe('CngxInputClear', () => {
  it('should be created', () => {
    const { directive } = setup();
    expect(directive).toBeTruthy();
  });

  it('should set aria-label to Clear', () => {
    const { button } = setup();
    expect(button.getAttribute('aria-label')).toBe('Clear');
  });

  it('should clear the input value on click', () => {
    const { input, button, fixture } = setup();
    expect(input.value).toBe('hello');
    button.click();
    fixture.detectChanges();
    expect(input.value).toBe('');
  });

  it('should emit cleared event', () => {
    const { directive, button } = setup();
    let emitted = false;
    directive.cleared.subscribe(() => (emitted = true));
    button.click();
    expect(emitted).toBe(true);
  });

  it('should track hasValue after clear triggers listener', () => {
    const { directive, button, input, fixture } = setup();
    // Click to initialize the listener and clear
    button.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(directive.hasValue()).toBe(false);

    // Type something
    input.value = 'test';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(directive.hasValue()).toBe(true);
  });
});
