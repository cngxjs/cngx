import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxAutosize } from './autosize.directive';

@Component({
  template: `<textarea cngxAutosize [minRows]="minRows" [maxRows]="maxRows"></textarea>`,
  imports: [CngxAutosize],
})
class Host {
  minRows = 1;
  maxRows: number | undefined = undefined;
  readonly directive = viewChild.required(CngxAutosize);
}

function setup(overrides: Partial<Host> = {}) {
  const fixture = TestBed.createComponent(Host);
  Object.assign(fixture.componentInstance, overrides);
  fixture.detectChanges();
  TestBed.flushEffects();

  const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, textarea, directive };
}

describe('CngxAutosize', () => {
  it('should be created', () => {
    const { directive } = setup();
    expect(directive).toBeTruthy();
  });

  it('should set resize to none', () => {
    const { textarea } = setup();
    expect(textarea.style.resize).toBe('none');
  });

  it('should set box-sizing to border-box', () => {
    const { textarea } = setup();
    expect(textarea.style.boxSizing).toBe('border-box');
  });

  it('should expose height signal', () => {
    const { directive } = setup();
    // In JSDOM, scrollHeight is 0, so height will be computed from minRows
    expect(typeof directive.height()).toBe('number');
  });

  it('should expose resize() method', () => {
    const { directive } = setup();
    expect(typeof directive.resize).toBe('function');
    // Should not throw
    directive.resize();
  });

  it('should set overflow-y to hidden when no maxRows', () => {
    const { textarea } = setup();
    expect(textarea.style.overflowY).toBe('hidden');
  });
});
