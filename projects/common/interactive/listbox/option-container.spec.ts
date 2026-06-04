import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxActiveDescendant } from '@cngx/common/a11y';

import { CNGX_OPTION_CONTAINER, type CngxOptionContainer } from './option-container';
import { CngxOption } from './option.directive';
import { CngxOptionGroup } from './option-group.directive';

@Component({
  template: `
    <div cngxActiveDescendant tabindex="0">
      <div cngxOption value="a">Apple</div>
      <div cngxOptionGroup label="Stone fruits">
        <div cngxOption [value]="cherryDisabled() ? 'c-disabled' : 'c'" [disabled]="cherryDisabled()">
          Cherry
        </div>
        <div cngxOption value="p">Plum</div>
      </div>
      <div cngxOption value="z">Zucchini</div>
    </div>
  `,
  imports: [CngxActiveDescendant, CngxOption, CngxOptionGroup],
})
class MixedHost {
  readonly cherryDisabled = signal(false);
}

@Component({
  template: `
    <div cngxActiveDescendant tabindex="0">
      <div cngxOptionGroup label="Outer">
        <div cngxOptionGroup label="Inner">
          <div cngxOption value="x">X</div>
        </div>
      </div>
    </div>
  `,
  imports: [CngxActiveDescendant, CngxOption, CngxOptionGroup],
})
class NestedGroupHost {}

describe('CNGX_OPTION_CONTAINER', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('option and group both register under the token with discriminated kinds', () => {
    const fixture = TestBed.createComponent(MixedHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const containers = fixture.debugElement
      .queryAll(By.directive(CngxOption))
      .map((d) => d.injector.get<CngxOptionContainer>(CNGX_OPTION_CONTAINER))
      .concat(
        fixture.debugElement
          .queryAll(By.directive(CngxOptionGroup))
          .map((d) => d.injector.get<CngxOptionContainer>(CNGX_OPTION_CONTAINER)),
      );

    const optionKinds = containers.filter((c) => c.kind === 'option');
    const groupKinds = containers.filter((c) => c.kind === 'group');

    expect(optionKinds.length).toBe(4);
    expect(groupKinds.length).toBe(1);
  });

  it('group exposes its direct options via a Signal in DOM order', () => {
    const fixture = TestBed.createComponent(MixedHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const group = fixture.debugElement.query(By.directive(CngxOptionGroup)).injector.get(CngxOptionGroup);
    const opts = group.options();
    expect(opts.length).toBe(2);
    expect(opts[0].value()).toBe('c');
    expect(opts[1].value()).toBe('p');
  });

  it('group.options() is reference-stable when no children change', () => {
    const fixture = TestBed.createComponent(MixedHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const group = fixture.debugElement.query(By.directive(CngxOptionGroup)).injector.get(CngxOptionGroup);
    const first = group.options();

    // Mutate a child option's [disabled] — the children themselves are
    // identical instances, so options() must return the same reference.
    fixture.componentInstance.cherryDisabled.set(true);
    TestBed.flushEffects();
    fixture.detectChanges();

    const second = group.options();
    expect(second).toBe(first);
  });

  it('dev-warns when an option group is nested inside another option group', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const fixture = TestBed.createComponent(NestedGroupHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Nested option groups are unsupported'),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
