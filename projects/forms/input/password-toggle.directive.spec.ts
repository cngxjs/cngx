import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxPasswordToggle } from './password-toggle.directive';

@Component({
  template: `<input cngxPasswordToggle #pwd="cngxPasswordToggle" type="password" />`,
  imports: [CngxPasswordToggle],
})
class TestHost {}

describe('CngxPasswordToggle', () => {
  let inputEl: HTMLInputElement;
  let directive: CngxPasswordToggle;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const debugEl = fixture.debugElement.query(By.directive(CngxPasswordToggle));
    inputEl = debugEl.nativeElement;
    directive = debugEl.injector.get(CngxPasswordToggle);
  });

  it('starts with type=password', () => {
    expect(inputEl.type).toBe('password');
  });

  it('starts with visible=false', () => {
    expect(directive.visible()).toBe(false);
  });

  it('toggles to type=text', () => {
    directive.toggle();
    TestBed.flushEffects();
    expect(inputEl.type).toBe('text');
    expect(directive.visible()).toBe(true);
  });

  it('toggles back to type=password', () => {
    directive.toggle();
    directive.toggle();
    TestBed.flushEffects();
    expect(inputEl.type).toBe('password');
    expect(directive.visible()).toBe(false);
  });

  it('show() sets type=text', () => {
    directive.show();
    TestBed.flushEffects();
    expect(inputEl.type).toBe('text');
  });

  it('hide() sets type=password', () => {
    directive.show();
    directive.hide();
    TestBed.flushEffects();
    expect(inputEl.type).toBe('password');
  });

  it('sets spellcheck=false', () => {
    expect(inputEl.getAttribute('spellcheck')).toBe('false');
  });

  it('sets autocomplete', () => {
    expect(inputEl.getAttribute('autocomplete')).toBe('current-password');
  });
});
