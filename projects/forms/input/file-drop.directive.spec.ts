import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import type { CngxAsyncState } from '@cngx/core/utils';
import { CngxFileDrop } from './file-drop.directive';
import { provideInputConfig, withFileMaxSize } from './input-config';

@Component({
  template: `<div
    cngxFileDrop
    [accept]="accept"
    [maxSize]="maxSize"
    [multiple]="multiple"
    [ariaLabel]="ariaLabel"
    [state]="state"
    #drop="cngxFileDrop"
  ></div>`,
  imports: [CngxFileDrop],
})
class Host {
  accept: string[] = [];
  maxSize: number | undefined = undefined;
  multiple = false;
  ariaLabel = 'File drop zone';
  state: CngxAsyncState<unknown> | undefined = undefined;
  readonly drop = viewChild.required(CngxFileDrop);
}

function busyState(): CngxAsyncState<unknown> {
  return {
    isBusy: signal(true),
    progress: signal(undefined),
    error: signal(undefined),
  } as unknown as CngxAsyncState<unknown>;
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

function createDropEvent(files: File[]): DragEvent {
  const event = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', { value: { files } });
  return event;
}

function createKeydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}

function file(name: string, content = 'x', lastModified = 1): File {
  return new File([content], name, { lastModified });
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

  it('should not set the deprecated aria-dropeffect attribute', () => {
    const { el } = setup();
    expect(el.hasAttribute('aria-dropeffect')).toBe(false);
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

  it('honours fileMaxSize from global config when no [maxSize] binding is set', () => {
    TestBed.configureTestingModule({
      providers: [provideInputConfig(withFileMaxSize(1000))],
    });
    const { el, directive } = setup();

    const bigFile = new File([new ArrayBuffer(1500)], 'big.bin');
    el.dispatchEvent(createDropEvent([bigFile]));

    expect(directive.files()).toEqual([]);
    expect(directive.rejected().map((r) => r.reason)).toEqual(['size']);
  });

  it('exposes a button role for keyboard operability', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('button');
  });

  it('is in the tab order while idle', () => {
    const { el } = setup();
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('leaves the tab order while uploading', () => {
    const { el } = setup({ state: busyState() });
    expect(el.getAttribute('tabindex')).toBe('-1');
  });

  it('uses the English default aria-label', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-label')).toBe('File drop zone');
  });

  it('honours a consumer-supplied ariaLabel', () => {
    const { el } = setup({ ariaLabel: 'Dateien ablegen' });
    expect(el.getAttribute('aria-label')).toBe('Dateien ablegen');
  });

  it('opens the picker on Enter', () => {
    const { el, directive } = setup();
    const browse = vi.spyOn(directive, 'browse').mockImplementation(() => {});
    el.dispatchEvent(createKeydown('Enter'));
    expect(browse).toHaveBeenCalledOnce();
  });

  it('opens the picker on Space', () => {
    const { el, directive } = setup();
    const browse = vi.spyOn(directive, 'browse').mockImplementation(() => {});
    el.dispatchEvent(createKeydown(' '));
    expect(browse).toHaveBeenCalledOnce();
  });

  it('accumulates files across drops in multiple mode', () => {
    const { el, directive } = setup({ multiple: true });
    el.dispatchEvent(createDropEvent([file('a.txt')]));
    el.dispatchEvent(createDropEvent([file('b.txt')]));
    expect(directive.files().map((f) => f.name)).toEqual(['a.txt', 'b.txt']);
  });

  it('dedups identical files across drops in multiple mode', () => {
    const { el, directive } = setup({ multiple: true });
    el.dispatchEvent(createDropEvent([file('a.txt')]));
    el.dispatchEvent(createDropEvent([file('a.txt')]));
    expect(directive.files().map((f) => f.name)).toEqual(['a.txt']);
  });

  it('replaces the selection on each drop in single mode', () => {
    const { el, directive } = setup({ multiple: false });
    el.dispatchEvent(createDropEvent([file('a.txt')]));
    el.dispatchEvent(createDropEvent([file('b.txt')]));
    expect(directive.files().map((f) => f.name)).toEqual(['b.txt']);
  });

  it('accumulates and dedups rejections in multiple mode', () => {
    const { el, directive } = setup({ multiple: true, accept: ['.png'] });
    el.dispatchEvent(createDropEvent([file('a.txt')]));
    el.dispatchEvent(createDropEvent([file('a.txt')]));
    expect(directive.rejected().map((r) => r.file.name)).toEqual(['a.txt']);
  });

  it('emits the full accumulated selection on each drop in multiple mode', () => {
    const { el, directive } = setup({ multiple: true });
    const emitted: string[][] = [];
    directive.filesChange.subscribe((files) => emitted.push(files.map((f) => f.name)));
    el.dispatchEvent(createDropEvent([file('a.txt')]));
    el.dispatchEvent(createDropEvent([file('b.txt')]));
    expect(emitted).toEqual([['a.txt'], ['a.txt', 'b.txt']]);
  });
});
