import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxCopyValue } from './copy-value.directive';

@Component({
  template: `<button [cngxCopyValue]="'test-value'" #cp="cngxCopyValue">Copy</button>`,
  imports: [CngxCopyValue],
})
class Host {
  readonly directive = viewChild.required(CngxCopyValue);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, button, directive };
}

describe('CngxCopyValue', () => {
  it('should be created', () => {
    const { directive } = setup();
    expect(directive).toBeTruthy();
  });

  it('should start with copied = false', () => {
    const { directive } = setup();
    expect(directive.copied()).toBe(false);
  });

  it('should expose copy() method', () => {
    const { directive } = setup();
    expect(typeof directive.copy).toBe('function');
  });
});
