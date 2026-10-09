import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CNGX_DEV_DESCRIPTORS, resolveDevDescriptors } from './dev-descriptors';
import { createOverrideMerge } from './override-merge';
import { createTransitionTracker } from './transition-tracker';

interface Labels {
  readonly open: string;
}

function createTestFactory<T extends object>(contents: T): T {
  return CNGX_DEV_DESCRIPTORS.tag(contents, {
    kind: 'cngx-dev:factory',
    factory: 'createTestFactory',
    inputs: {},
  });
}

@Directive({ selector: '[cngxDescribed]' })
class Described {
  private readonly tracker = createTransitionTracker(signal('idle'));
  protected readonly labels = createOverrideMerge<Labels>({ open: 'Open' }, { open: 'Go' });
  readonly field = createTestFactory({
    tracker: createTransitionTracker(signal(0)),
    deeper: createTestFactory({ tooDeep: createTransitionTracker(signal(0)) }),
  });
  readonly cyclic = createCyclic();

  peekTracker(): object {
    return this.tracker;
  }
}

function createCyclic(): object {
  const value: { self?: object } = {};
  value.self = value;
  return createTestFactory(value);
}

@Component({
  template: `<div cngxDescribed></div>`,
  imports: [Described],
})
class Host {}

function mount(): Described {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture.debugElement.query(By.directive(Described)).injector.get(Described);
}

describe('resolveDevDescriptors on a mounted directive', () => {
  it('finds factory results in private, protected and nested fields with their paths', () => {
    const instance = mount();

    const entries = resolveDevDescriptors(instance);
    const byPath = new Map(entries.map((entry) => [entry.path.join('.'), entry.descriptor]));

    expect(byPath.get('tracker')).toBe(CNGX_DEV_DESCRIPTORS.read(instance.peekTracker()));
    expect(byPath.get('tracker')).toMatchObject({ factory: 'createTransitionTracker' });
    expect(byPath.get('labels')?.kind).toBe('cngx-dev:override-merge');
    expect(byPath.get('field')).toMatchObject({ factory: 'createTestFactory' });
    expect(byPath.get('field.tracker')).toMatchObject({ factory: 'createTransitionTracker' });
  });

  it('stops at a field chain of two', () => {
    const paths = resolveDevDescriptors(mount()).map((entry) => entry.path.join('.'));

    expect(paths).toContain('field.deeper');
    expect(paths).not.toContain('field.deeper.tooDeep');
  });

  it('terminates on a cyclic tagged object', () => {
    const paths = resolveDevDescriptors(mount()).map((entry) => entry.path.join('.'));

    expect(paths.filter((path) => path.startsWith('cyclic'))).toEqual(['cyclic']);
  });
});
