import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxFilterEditorComponent } from './filter-builder-editor.contract';

@Component({
  selector: 'cngx-test-string-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<input data-test="string-editor-input" [value]="value() ?? \'\'" />',
})
class StringEditorFixture implements CngxFilterEditorComponent<string> {
  readonly value = model<string | null>('');
}

describe('CngxFilterEditorComponent<TValue>', () => {
  it('is structurally satisfied by a component exposing value = model<T>()', () => {
    const fixture = TestBed.createComponent(StringEditorFixture);
    const editor: CngxFilterEditorComponent<string> = fixture.componentInstance;
    expect(editor.value).toBeDefined();
    expect(typeof editor.value.set).toBe('function');
    expect(typeof editor.value.update).toBe('function');
  });

  it('TestBed-mounts the editor fixture and write-through propagates via the model signal', () => {
    const fixture = TestBed.createComponent(StringEditorFixture);
    fixture.detectChanges();

    const instance: CngxFilterEditorComponent<string> = fixture.componentInstance;
    expect(instance.value()).toBe('');

    instance.value.set('written-through');
    fixture.detectChanges();

    expect(instance.value()).toBe('written-through');
  });
});
