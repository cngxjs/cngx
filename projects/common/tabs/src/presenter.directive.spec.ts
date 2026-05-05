import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxTabGroupPresenter } from './presenter.directive';
import type { CngxTabHandle } from './tab-group-host.token';

function handle(
  id: string,
  opts: { label?: string; disabled?: boolean } = {},
): CngxTabHandle {
  return {
    id,
    label: signal(opts.label ?? id),
    disabled: signal(opts.disabled ?? false),
    errorAggregator: signal(undefined),
  };
}

@Component({
  standalone: true,
  selector: 'host-cmp',
  hostDirectives: [
    {
      directive: CngxTabGroupPresenter,
      inputs: ['orientation', 'loop', 'commitAction', 'commitMode'],
    },
  ],
  template: '',
})
class HostCmp {}

function setup(): { presenter: CngxTabGroupPresenter } {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(HostCmp);
  fixture.detectChanges();
  const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
  return { presenter };
}

describe('CngxTabGroupPresenter', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts with empty registry, activeIndex=0, activeId=null', () => {
    const { presenter } = setup();
    expect(presenter.tabs().length).toBe(0);
    expect(presenter.activeIndex()).toBe(0);
    expect(presenter.activeId()).toBeNull();
  });

  it('register appends tabs in insertion order', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    presenter.register(handle('b'));
    presenter.register(handle('c'));
    expect(presenter.tabs().map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(presenter.activeId()).toBe('a');
  });

  it('register is idempotent — re-registering the same id replaces in place', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    presenter.register(handle('b'));
    const replacement = handle('a', { label: 'A2' });
    presenter.register(replacement);
    expect(presenter.tabs().map((t) => t.id)).toEqual(['a', 'b']);
    expect(presenter.tabs()[0]).toBe(replacement);
  });

  it('unregister removes a tab by id', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    presenter.register(handle('b'));
    presenter.unregister('a');
    expect(presenter.tabs().map((t) => t.id)).toEqual(['b']);
  });

  it('unregister of an unknown id is a no-op', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    const before = presenter.tabs();
    presenter.unregister('does-not-exist');
    expect(presenter.tabs()).toBe(before);
  });

  it('select clamps the index against the registry length', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    presenter.register(handle('b'));
    presenter.select(99);
    expect(presenter.activeIndex()).toBe(1);
    presenter.select(-5);
    expect(presenter.activeIndex()).toBe(0);
  });

  it('select on an empty registry is a no-op', () => {
    const { presenter } = setup();
    presenter.select(0);
    expect(presenter.activeIndex()).toBe(0);
  });

  it('select skips disabled tabs', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    presenter.register(handle('b', { disabled: true }));
    presenter.register(handle('c'));
    presenter.select(1);
    expect(presenter.activeIndex()).toBe(0);
  });

  it('selectNext / selectPrevious skip disabled tabs', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    presenter.register(handle('b', { disabled: true }));
    presenter.register(handle('c'));
    presenter.selectNext();
    expect(presenter.activeId()).toBe('c');
    presenter.selectPrevious();
    expect(presenter.activeId()).toBe('a');
  });

  it('selectNext loops to first when [loop]=true (default) and at end', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    presenter.register(handle('b'));
    presenter.select(1);
    presenter.selectNext();
    expect(presenter.activeIndex()).toBe(0);
  });

  it('selectPrevious loops to last when [loop]=true (default) and at start', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    presenter.register(handle('b'));
    presenter.selectPrevious();
    expect(presenter.activeIndex()).toBe(1);
  });

  it('selectNext does not loop when [loop]=false and at end', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.componentRef.setInput('loop', false);
    fixture.detectChanges();
    const p = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    p.register(handle('a'));
    p.register(handle('b'));
    p.select(1);
    p.selectNext();
    expect(p.activeIndex()).toBe(1);
  });

  it('selectById resolves an id to its index', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    presenter.register(handle('b'));
    presenter.register(handle('c'));
    presenter.selectById('b');
    expect(presenter.activeIndex()).toBe(1);
  });

  it('selectById on unknown id is a no-op', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    presenter.selectById('zzz');
    expect(presenter.activeIndex()).toBe(0);
  });

  it('tabs() applies tabsEqual short-circuit on idempotent re-register', () => {
    const { presenter } = setup();
    const a = handle('a');
    presenter.register(a);
    const before = presenter.tabs();
    presenter.register(handle('a')); // same id, equal disabled+label
    const after = presenter.tabs();
    // Structural-equal short-circuit keeps the same array reference,
    // preventing downstream computed cascades.
    expect(after).toBe(before);
  });

  it('exposes commitState via the CNGX_STATEFUL contract', () => {
    const { presenter } = setup();
    expect(presenter.commitState.status()).toBe('idle');
    expect(presenter.state).toBe(presenter.commitState);
  });

  it('intendedIndex starts undefined (no commit in flight)', () => {
    const { presenter } = setup();
    expect(presenter.intendedIndex()).toBeUndefined();
  });

  it('orientation defaults to "horizontal"', () => {
    const { presenter } = setup();
    expect(presenter.orientation()).toBe('horizontal');
  });

  it('loop defaults to true', () => {
    const { presenter } = setup();
    expect(presenter.loop()).toBe(true);
  });

  it('commitMode defaults to "optimistic"', () => {
    const { presenter } = setup();
    expect(presenter.commitMode()).toBe('optimistic');
  });

  it('orientation Input flows through hostDirective forwarding', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.detectChanges();
    const p = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    expect(p.orientation()).toBe('vertical');
  });

  describe('commit-action lifecycle', () => {
    function commitFixture(
      mode: 'optimistic' | 'pessimistic',
      action: (from: number, to: number) => unknown,
    ): { presenter: CngxTabGroupPresenter } {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      @Component({
        standalone: true,
        hostDirectives: [
          {
            directive: CngxTabGroupPresenter,
            inputs: ['commitAction', 'commitMode'],
          },
        ],
        template: '',
      })
      class CommitHost {}
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentRef.setInput('commitAction', action);
      fixture.componentRef.setInput('commitMode', mode);
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
      presenter.register(handle('a'));
      presenter.register(handle('b'));
      presenter.register(handle('c'));
      return { presenter };
    }

    it('optimistic + sync success: stays advanced', () => {
      const { presenter } = commitFixture('optimistic', () => true);
      presenter.select(2);
      expect(presenter.activeIndex()).toBe(2);
    });

    it('optimistic + sync rejection: rolls back to origin', () => {
      const { presenter } = commitFixture('optimistic', () => false);
      presenter.select(2);
      expect(presenter.activeIndex()).toBe(0);
    });

    it('pessimistic + sync success: advances on resolution', () => {
      const { presenter } = commitFixture('pessimistic', () => true);
      expect(presenter.activeIndex()).toBe(0);
      presenter.select(2);
      expect(presenter.activeIndex()).toBe(2);
    });

    it('pessimistic + sync rejection: stays on origin', () => {
      const { presenter } = commitFixture('pessimistic', () => false);
      presenter.select(2);
      expect(presenter.activeIndex()).toBe(0);
    });

    it('optimistic + Observable success: stays advanced', () => {
      const { presenter } = commitFixture('optimistic', () => of(true));
      presenter.select(2);
      expect(presenter.activeIndex()).toBe(2);
    });

    it('optimistic + Observable error: rolls back to origin', () => {
      const { presenter } = commitFixture('optimistic', () =>
        throwError(() => new Error('refused')),
      );
      presenter.select(2);
      expect(presenter.activeIndex()).toBe(0);
    });

    it('supersede: rapid second select cancels the first commit', () => {
      // First action never resolves (Subject); second action resolves
      // true. Supersede semantics from the lifted controller mean the
      // first never advances; only the second's outcome lands.
      const subj = new Subject<boolean>();
      let toggle = 0;
      const { presenter } = commitFixture('pessimistic', (_from, to) => {
        if (toggle === 0) {
          toggle = 1;
          return subj;
        }
        return to === 1 ? true : false;
      });
      presenter.select(2);
      expect(presenter.activeIndex()).toBe(0);
      presenter.select(1);
      expect(presenter.activeIndex()).toBe(1);
      // Late emit on the first subject must be ignored.
      subj.next(true);
      subj.complete();
      expect(presenter.activeIndex()).toBe(1);
    });
  });

  it('activeId rejoins the live tab after unregister + re-register', () => {
    const { presenter } = setup();
    presenter.register(handle('a'));
    presenter.register(handle('b'));
    presenter.select(1);
    expect(presenter.activeId()).toBe('b');
    presenter.unregister('b');
    // activeIndex is clamped against the new length.
    expect(presenter.activeId()).toBe('a');
    presenter.register(handle('b'));
    expect(presenter.tabs().map((t) => t.id)).toEqual(['a', 'b']);
  });
});
