import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxTabGroupPresenter } from './presenter.directive';
import type { CngxTabHandle } from './tab-group-host.token';
import { CngxTabLink } from './tab-link.directive';

@Component({
  standalone: true,
  selector: 'tab-link-host',
  imports: [CngxTabLink],
  hostDirectives: [CngxTabGroupPresenter],
  template: `
    <a cngxTabLink id="overview" [label]="'Overview'">Overview</a>
    <a cngxTabLink id="profile" [label]="'Profile'" [error]="profileError()">Profile</a>
  `,
})
class TabLinkHost {
  readonly profileError = signal<string | boolean>(false);
}

@Component({
  standalone: true,
  selector: 'orphan-link',
  imports: [CngxTabLink],
  template: '<a cngxTabLink></a>',
})
class OrphanLink {}

describe('CngxTabLink', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TabLinkHost>>;
    presenter: CngxTabGroupPresenter;
    anchor: (i: number) => HTMLAnchorElement;
    handle: (id: string) => CngxTabHandle | undefined;
  } {
    const fixture = TestBed.createComponent(TabLinkHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    const anchors = fixture.debugElement
      .queryAll(By.directive(CngxTabLink))
      .map((d) => d.nativeElement as HTMLAnchorElement);
    return {
      fixture,
      presenter,
      anchor: (i) => anchors[i],
      handle: (id) => presenter.tabs().find((t) => t.id === id),
    };
  }

  it('registers each link as a handle with the bound id and label', () => {
    const { presenter } = setup();
    const tabs = presenter.tabs();
    expect(tabs.map((t) => t.id)).toEqual(['overview', 'profile']);
    expect(tabs.map((t) => t.label())).toEqual(['Overview', 'Profile']);
  });

  it('unregisters every link via DestroyRef on teardown', () => {
    const { fixture, presenter } = setup();
    expect(presenter.tabs().length).toBe(2);
    fixture.destroy();
    expect(presenter.tabs().length).toBe(0);
  });

  it('falls back to a fresh cngx-tab-link- uid when [id] is unset', () => {
    @Component({
      standalone: true,
      selector: 'auto-id-host',
      imports: [CngxTabLink],
      hostDirectives: [CngxTabGroupPresenter],
      template: `<a cngxTabLink></a>`,
    })
    class AutoIdHost {}
    const fixture = TestBed.createComponent(AutoIdHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    expect(presenter.tabs()[0].id).toMatch(/^cngx-tab-link-/);
  });

  it('aria-current flips to page on the active link and clears on the rest', () => {
    const { fixture, presenter, anchor } = setup();
    expect(anchor(0).getAttribute('aria-current')).toBe('page');
    expect(anchor(1).getAttribute('aria-current')).toBeNull();
    expect(anchor(0).classList.contains('cngx-tab-nav__link--active')).toBe(true);

    presenter.select(1);
    fixture.detectChanges();
    expect(anchor(0).getAttribute('aria-current')).toBeNull();
    expect(anchor(1).getAttribute('aria-current')).toBe('page');
    expect(anchor(1).classList.contains('cngx-tab-nav__link--active')).toBe(true);
  });

  it('aria-invalid + --error class track the direct [error] flag', () => {
    const { fixture, anchor, handle } = setup();
    expect(anchor(1).getAttribute('aria-invalid')).toBeNull();
    expect(anchor(1).classList.contains('cngx-tab-nav__link--error')).toBe(false);

    fixture.componentInstance.profileError.set(true);
    fixture.detectChanges();
    expect(anchor(1).getAttribute('aria-invalid')).toBe('true');
    expect(anchor(1).classList.contains('cngx-tab-nav__link--error')).toBe(true);
    expect(handle('profile')?.hasError()).toBe(true);
  });

  it("[error]=\"'msg'\" exposes the string through the handle errorMessage", () => {
    const { fixture, handle } = setup();
    expect(handle('profile')?.errorMessage()).toBeUndefined();
    fixture.componentInstance.profileError.set('Required fields missing');
    fixture.detectChanges();
    expect(handle('profile')?.hasError()).toBe(true);
    expect(handle('profile')?.errorMessage()).toBe('Required fields missing');
  });

  it('folds the error aggregator shouldShow() independently of the direct flag', () => {
    @Component({
      standalone: true,
      selector: 'agg-link-host',
      imports: [CngxTabLink],
      hostDirectives: [CngxTabGroupPresenter],
      template: `<a cngxTabLink id="agg" [label]="'Agg'" [errorAggregator]="agg"></a>`,
    })
    class AggLinkHost {
      readonly aggHasError = signal(false);
      readonly agg = {
        hasError: this.aggHasError,
        shouldShow: this.aggHasError,
        announcement: signal(''),
        errorCount: signal(0),
        errorLabels: signal([] as readonly string[]),
        activeErrors: signal([] as readonly string[]),
        addSource: () => {},
        removeSource: () => {},
      };
    }
    const fixture = TestBed.createComponent(AggLinkHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    const anchor = fixture.debugElement.query(By.directive(CngxTabLink))
      .nativeElement as HTMLAnchorElement;
    const handle = presenter.tabs()[0];
    expect(handle.hasError()).toBe(false);
    expect(anchor.getAttribute('aria-invalid')).toBeNull();

    fixture.componentInstance.aggHasError.set(true);
    fixture.detectChanges();
    expect(handle.hasError()).toBe(true);
    expect(anchor.getAttribute('aria-invalid')).toBe('true');
    // the aggregator path carries no direct message
    expect(handle.errorMessage()).toBeUndefined();
  });

  it('throws a clear dev-mode error when no presenter is on the ancestor', () => {
    expect(() => {
      const fixture = TestBed.createComponent(OrphanLink);
      fixture.detectChanges();
    }).toThrow(/no enclosing CngxTabGroupPresenter/);
  });

  describe('SR error-message descriptor', () => {
    function descriptor(
      fixture: ReturnType<typeof TestBed.createComponent<TabLinkHost>>,
      id: string,
    ): HTMLElement | null {
      return fixture.nativeElement.querySelector(`#${id}-desc`);
    }

    it('always references a permanent descriptor id via aria-describedby', () => {
      const { anchor } = setup();
      expect(anchor(0).getAttribute('aria-describedby')).toBe('overview-desc');
      expect(anchor(1).getAttribute('aria-describedby')).toBe('profile-desc');
    });

    it('injects the descriptor as a hidden sibling, not a child of the anchor', () => {
      const { fixture, anchor } = setup();
      const span = descriptor(fixture, 'profile');
      expect(span).not.toBeNull();
      expect(span!.classList.contains('cngx-sr-only')).toBe(true);
      // Sibling, never a child - a child would fold into the link's name.
      expect(anchor(1).contains(span)).toBe(false);
    });

    it('stays empty + aria-hidden while the link has no error', () => {
      const { fixture } = setup();
      const span = descriptor(fixture, 'profile')!;
      expect(span.textContent).toBe('');
      expect(span.getAttribute('aria-hidden')).toBe('true');
    });

    it('carries the direct [error] message and drops aria-hidden when set', () => {
      const { fixture } = setup();
      fixture.componentInstance.profileError.set('Required fields missing');
      fixture.detectChanges();
      const span = descriptor(fixture, 'profile')!;
      expect(span.textContent).toBe('Required fields missing');
      expect(span.getAttribute('aria-hidden')).toBeNull();
    });

    it('re-hides the descriptor when the message clears', () => {
      const { fixture } = setup();
      fixture.componentInstance.profileError.set('Boom');
      fixture.detectChanges();
      fixture.componentInstance.profileError.set(false);
      fixture.detectChanges();
      const span = descriptor(fixture, 'profile')!;
      expect(span.textContent).toBe('');
      expect(span.getAttribute('aria-hidden')).toBe('true');
    });

    it('removes the descriptor span on teardown', () => {
      const { fixture } = setup();
      expect(descriptor(fixture, 'profile')).not.toBeNull();
      fixture.destroy();
      expect(descriptor(fixture, 'profile')).toBeNull();
    });
  });
});
