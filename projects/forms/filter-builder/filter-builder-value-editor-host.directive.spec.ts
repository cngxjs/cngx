import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  signal,
  type Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';

import type { CngxFilterEditorComponent } from './filter-builder-editor.contract';
import { CngxFilterValueEditorHost } from './filter-builder-value-editor-host.directive';
import { createFilterExpression } from './filter-builder.helpers';
import type { FilterExpression, FilterFieldDef } from './filter-builder.types';

const FIELD_RATING: FilterFieldDef = { key: 'rating', label: 'Rating', editorType: 'rating' };

@Component({
  selector: 'cngx-spec-full-contract-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span data-test="editor-value">{{ value() }}</span>`,
})
class FullContractEditor implements CngxFilterEditorComponent<number> {
  readonly value = model<number | null>(null);
  readonly fieldDef = input<FilterFieldDef | undefined>(undefined);
  readonly expression = input<FilterExpression | undefined>(undefined);
  readonly disabled = input<boolean>(false);
}

@Component({
  selector: 'cngx-spec-minimal-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span data-test="minimal-value">{{ value() }}</span>`,
})
class MinimalEditor implements CngxFilterEditorComponent<string> {
  readonly value = model<string | null>(null);
}

@Component({
  selector: 'cngx-spec-range-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
})
class RangeEditor implements CngxFilterEditorComponent<readonly [number, number]> {
  readonly value = model<readonly [number, number] | null>(null);
}

@Component({
  template: `<ng-container
    [cngxFilterValueEditorHost]="component()"
    [value]="value()"
    [fieldDef]="fieldDef()"
    [expression]="expression()"
    [disabled]="disabled()"
    [setValue]="setValue"
  ></ng-container>`,
  imports: [CngxFilterValueEditorHost],
})
class HostShell {
  readonly component = signal<Type<CngxFilterEditorComponent<unknown>>>(
    FullContractEditor as Type<CngxFilterEditorComponent<unknown>>,
  );
  readonly value = signal<unknown>(3);
  readonly fieldDef = signal<FilterFieldDef | undefined>(FIELD_RATING);
  readonly expression = signal<FilterExpression | undefined>(
    createFilterExpression('rating', 'eq', 3),
  );
  readonly disabled = signal(false);
  readonly setValue = vi.fn<(value: unknown) => void>();
}

function setup(overrides: Partial<{ component: Type<CngxFilterEditorComponent<unknown>>; value: unknown }> = {}) {
  const fixture = TestBed.createComponent(HostShell);
  const shell = fixture.componentInstance;
  if (overrides.component) {
    shell.component.set(overrides.component);
  }
  if ('value' in overrides) {
    shell.value.set(overrides.value);
  }
  fixture.detectChanges();
  TestBed.flushEffects();
  return { fixture, shell };
}

describe('CngxFilterValueEditorHost - contract projection', () => {
  it('projects all four contract inputs onto the mounted editor', () => {
    const { fixture, shell } = setup();
    const editor = fixture.debugElement.query(By.directive(FullContractEditor))
      .componentInstance as FullContractEditor;

    expect(editor.value()).toBe(3);
    expect(editor.fieldDef()).toBe(FIELD_RATING);
    expect(editor.expression()).toBe(shell.expression());
    expect(editor.disabled()).toBe(false);
  });

  it('re-pushes input changes onto the mounted instance', () => {
    const { fixture, shell } = setup();
    const editor = fixture.debugElement.query(By.directive(FullContractEditor))
      .componentInstance as FullContractEditor;

    shell.value.set(5);
    shell.disabled.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(editor.value()).toBe(5);
    expect(editor.disabled()).toBe(true);
  });

  it('tolerates an editor that declares only the required value model', () => {
    const { fixture } = setup({ component: MinimalEditor as Type<CngxFilterEditorComponent<unknown>>, value: 'hello' });
    const editor = fixture.debugElement.query(By.directive(MinimalEditor))
      .componentInstance as MinimalEditor;

    expect(editor.value()).toBe('hello');
  });
});

describe('CngxFilterValueEditorHost - value round trip', () => {
  it('routes an editor-originated value change into the sink exactly once', () => {
    const { fixture, shell } = setup();
    const editor = fixture.debugElement.query(By.directive(FullContractEditor))
      .componentInstance as FullContractEditor;

    editor.value.set(7);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(shell.setValue).toHaveBeenCalledExactlyOnceWith(7);
  });

  it('round-trips through a minimal editor without optional inputs', () => {
    const { fixture, shell } = setup({ component: MinimalEditor as Type<CngxFilterEditorComponent<unknown>>, value: 'a' });
    const editor = fixture.debugElement.query(By.directive(MinimalEditor))
      .componentInstance as MinimalEditor;

    editor.value.set('b');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(shell.setValue).toHaveBeenCalledExactlyOnceWith('b');
  });
});

describe('CngxFilterValueEditorHost - echo guard (no effect loop)', () => {
  it('scalar shape: a pushed value never re-enters the sink and an equal re-set stays silent', () => {
    const { fixture, shell } = setup();
    const editor = fixture.debugElement.query(By.directive(FullContractEditor))
      .componentInstance as FullContractEditor;

    // Mount push (value 3) must not have produced any sink call.
    expect(shell.setValue).not.toHaveBeenCalled();

    editor.value.set(3);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(shell.setValue).not.toHaveBeenCalled();

    editor.value.set(9);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(shell.setValue).toHaveBeenCalledTimes(1);

    // The host writing the committed value back as a fresh input must not
    // bounce another sink call.
    shell.value.set(9);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(shell.setValue).toHaveBeenCalledTimes(1);
  });

  it('fresh-array shape: equal-content [min, max] references break the cycle via arrayEqual', () => {
    const { fixture, shell } = setup({ component: RangeEditor as Type<CngxFilterEditorComponent<unknown>>, value: [1, 5] });
    const editor = fixture.debugElement.query(By.directive(RangeEditor))
      .componentInstance as RangeEditor;

    expect(editor.value()).toEqual([1, 5]);
    expect(shell.setValue).not.toHaveBeenCalled();

    editor.value.set([2, 6]);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(shell.setValue).toHaveBeenCalledExactlyOnceWith([2, 6]);

    // Host echoes the commit back as a FRESH array with equal content -
    // arrayEqual must keep the loop broken and the editor reference stable.
    shell.value.set([2, 6]);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(shell.setValue).toHaveBeenCalledTimes(1);

    // Editor emitting an equal-content fresh array is also not a change.
    editor.value.set([2, 6]);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(shell.setValue).toHaveBeenCalledTimes(1);
  });
});

describe('CngxFilterValueEditorHost - remount', () => {
  it('swaps the mounted component when the component input changes and keeps syncing', () => {
    const { fixture, shell } = setup();
    expect(fixture.debugElement.query(By.directive(FullContractEditor))).not.toBeNull();

    shell.component.set(MinimalEditor as Type<CngxFilterEditorComponent<unknown>>);
    shell.value.set('swapped');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.debugElement.query(By.directive(FullContractEditor))).toBeNull();
    const editor = fixture.debugElement.query(By.directive(MinimalEditor))
      .componentInstance as MinimalEditor;
    expect(editor.value()).toBe('swapped');

    editor.value.set('from-new-editor');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(shell.setValue).toHaveBeenCalledExactlyOnceWith('from-new-editor');
  });
});
