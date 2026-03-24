import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxFileDrop } from './file-drop.directive';

@Component({
  template: `<div cngxFileDrop [accept]="accept" [maxSize]="maxSize" [multiple]="multiple" #drop="cngxFileDrop"></div>`,
  imports: [CngxFileDrop],
})
class Host {
  accept: string[] = [];
  maxSize: number | undefined = undefined;
  multiple = false;
  readonly drop = viewChild.required(CngxFileDrop);
}

function setup(overrides: Partial<Host> = {}) {
  const fixture = TestBed.createComponent(Host);
  Object.assign(fixture.componentInstance, overrides);
  fixture.detectChanges();
  TestBed.flushEffects();
  const el = fixture.nativeElement.querySelector('div') as HTMLDivElement;
  const directive = fixture.componentInstance.drop();
  return { fixture, el, directive };
}

function createDragEvent(type: string): DragEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', { value: { files: [] } });
  return event;
}

describe('CngxFileDrop', () => {
  it('should be created', () => {
    const { directive } = setup();
    expect(directive).toBeTruthy();
  });

  it('should start with no files', () => {
    const { directive } = setup();
    expect(directive.files()).toEqual([]);
    expect(directive.dragging()).toBe(false);
  });

  it('should set aria-dropeffect', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-dropeffect')).toBe('copy');
  });

  it('should set dragging on dragenter', () => {
    const { el, directive } = setup();
    el.dispatchEvent(createDragEvent('dragenter'));
    expect(directive.dragging()).toBe(true);
  });

  it('should unset dragging on dragleave', () => {
    const { el, directive } = setup();
    el.dispatchEvent(createDragEvent('dragenter'));
    expect(directive.dragging()).toBe(true);
    el.dispatchEvent(createDragEvent('dragleave'));
    expect(directive.dragging()).toBe(false);
  });

  it('should handle nested element drag counter', () => {
    const { el, directive } = setup();
    // Enter parent → enter child → leave child → should still be dragging
    el.dispatchEvent(createDragEvent('dragenter'));
    el.dispatchEvent(createDragEvent('dragenter'));
    expect(directive.dragging()).toBe(true);
    el.dispatchEvent(createDragEvent('dragleave'));
    expect(directive.dragging()).toBe(true);
    el.dispatchEvent(createDragEvent('dragleave'));
    expect(directive.dragging()).toBe(false);
  });

  it('should clear files and rejected', () => {
    const { directive } = setup();
    directive.clear();
    expect(directive.files()).toEqual([]);
    expect(directive.rejected()).toEqual([]);
  });

  it('should expose browse() method', () => {
    const { directive } = setup();
    expect(typeof directive.browse).toBe('function');
  });
});
