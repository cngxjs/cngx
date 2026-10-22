import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { CngxAsyncClick, type AsyncAction } from '@cngx/common/interactive';
import { vi } from 'vitest';

import {
  provideButtonConfig,
  provideButtonConfigAt,
  withButtonSize,
  withButtonTone,
  withButtonVariant,
} from './button-config';
import { CNGX_BUTTON_GROUP } from './button-group.token';
import { CngxButton } from './button.component';
import type {
  CngxButtonSize,
  CngxButtonTone,
  CngxButtonType,
  CngxButtonVariant,
} from './button.types';
import { CngxButtonEnd, CngxButtonStart } from './slots';

function render<T>(type: new () => T) {
  const fixture = TestBed.createComponent(type);
  fixture.detectChanges();
  TestBed.flushEffects();
  const el = fixture.nativeElement as HTMLElement;
  const q = <E extends Element = HTMLButtonElement>(sel: string) => el.querySelector(sel) as E;
  return { fixture, host: fixture.componentInstance, q };
}

@Component({
  template: `
    <button id="bare" cngxButton>Bare</button>
    <button id="static" cngxButton="outline" tone="danger" size="sm">Static</button>
    <button id="bound" [cngxButton]="variant()" [tone]="tone()" [size]="size()">Bound</button>
  `,
  imports: [CngxButton],
})
class AxisHost {
  readonly variant = signal<CngxButtonVariant | undefined>('ghost');
  readonly tone = signal<CngxButtonTone | undefined>('primary');
  readonly size = signal<CngxButtonSize | undefined>('lg');
}

@Component({
  selector: 'test-group',
  template: `<button id="in-group" cngxButton>A</button
    ><button id="own" cngxButton="link" size="xs">B</button>`,
  imports: [CngxButton],
  providers: [
    {
      provide: CNGX_BUTTON_GROUP,
      useValue: {
        variant: signal<CngxButtonVariant | undefined>('outline'),
        size: signal<CngxButtonSize | undefined>('sm'),
      },
    },
  ],
  viewProviders: [
    provideButtonConfigAt(
      withButtonVariant('secondary'),
      withButtonTone('primary'),
      withButtonSize('lg'),
    ),
  ],
})
class GroupScope {}

@Component({
  selector: 'test-scoped',
  template: `<button id="scoped" cngxButton>C</button>`,
  imports: [CngxButton],
  viewProviders: [provideButtonConfigAt(withButtonSize('xs'))],
})
class ConfigScope {}

@Component({
  template: `<test-group /><test-scoped /><button id="root" cngxButton>D</button>`,
  imports: [CngxButton, GroupScope, ConfigScope],
})
class CascadeHost {}

@Component({
  template: `
    <button id="default" cngxButton>Default</button>
    <button id="submit" cngxButton type="submit">Submit</button>
    <button id="bound-type" cngxButton [type]="type()">Bound</button>
    <a id="anchor" cngxButton href="#x">Anchor</a>
  `,
  imports: [CngxButton],
})
class TypeHost {
  readonly type = signal<CngxButtonType | undefined>('reset');
}

@Component({
  template: `
    <button
      id="btn"
      cngxButton
      [disabled]="disabled()"
      [disabledReason]="reason()"
      (click)="clicks = clicks + 1"
      (auxclick)="auxClicks = auxClicks + 1"
    >
      Delete
    </button>
    <button id="static-disabled" cngxButton disabled>Static</button>
  `,
  imports: [CngxButton],
})
class DisabledHost {
  readonly disabled = signal(true);
  readonly reason = signal<string | undefined>('You need edit rights');
  clicks = 0;
  auxClicks = 0;
}

@Component({
  template: `<a id="link" cngxButton routerLink="/next" [disabled]="disabled()">Next</a>`,
  imports: [CngxButton, RouterLink],
})
class RouterHost {
  readonly disabled = signal(true);
}

@Component({
  template: `
    <form (submit)="onSubmit($event)">
      <input id="field" aria-label="Name" />
      <button id="submit" cngxButton type="submit" [disabled]="disabled()">Send</button>
    </form>
  `,
  imports: [CngxButton],
})
class FormHost {
  readonly disabled = signal(true);
  submits = 0;
  onSubmit(event: Event): void {
    event.preventDefault();
    this.submits++;
  }
}

@Component({
  template: `
    <button id="button-first" cngxButton [cngxAsyncClick]="action" [disabled]="disabled()">
      A
    </button>
    <button id="click-first" [cngxAsyncClick]="action" cngxButton [disabled]="disabled()">B</button>
  `,
  imports: [CngxButton, CngxAsyncClick],
})
class AsyncHost {
  readonly disabled = signal(true);
  calls = 0;
  release: () => void = () => undefined;
  readonly action: AsyncAction = () => {
    this.calls++;
    return new Promise<void>((resolve) => (this.release = resolve));
  };
}

@Component({
  template: `
    <button id="slots" cngxButton>
      <span cngxButtonStart>S</span>Label<span cngxButtonEnd>E</span>
    </button>
    <button id="plain" cngxButton>Label</button>
  `,
  imports: [CngxButton, CngxButtonStart, CngxButtonEnd],
})
class SlotHost {}

describe('CngxButton', () => {
  describe('axis resolution', () => {
    it('falls back to solid / neutral / md', () => {
      const { q } = render(AxisHost);
      const el = q('#bare');
      expect(el.dataset['variant']).toBe('solid');
      expect(el.dataset['tone']).toBe('neutral');
      expect(el.dataset['size']).toBe('md');
      expect(el.classList).toContain('cngx-button');
    });

    it('reads a static selector value and a bound one into the same variant input', () => {
      const { fixture, host, q } = render(AxisHost);
      expect(q('#static').dataset['variant']).toBe('outline');
      expect(q('#static').dataset['tone']).toBe('danger');
      expect(q('#static').dataset['size']).toBe('sm');
      expect(q('#bound').dataset['variant']).toBe('ghost');
      host.variant.set(undefined);
      host.tone.set(undefined);
      host.size.set(undefined);
      fixture.detectChanges();
      expect(q('#bound').dataset['variant']).toBe('solid');
      expect(q('#bound').dataset['tone']).toBe('neutral');
      expect(q('#bound').dataset['size']).toBe('md');
    });

    it('resolves input over group over scoped config over root config', () => {
      TestBed.configureTestingModule({
        providers: [provideButtonConfig(withButtonVariant('ghost'), withButtonTone('danger'))],
      });
      const { q } = render(CascadeHost);
      // group beats config for variant and size; tone has no group axis
      expect(q('#in-group').dataset['variant']).toBe('outline');
      expect(q('#in-group').dataset['size']).toBe('sm');
      expect(q('#in-group').dataset['tone']).toBe('primary');
      // own input beats group
      expect(q('#own').dataset['variant']).toBe('link');
      expect(q('#own').dataset['size']).toBe('xs');
      // scoped config merges on top of the root config
      expect(q('#scoped').dataset['size']).toBe('xs');
      expect(q('#scoped').dataset['variant']).toBe('ghost');
      expect(q('#scoped').dataset['tone']).toBe('danger');
      expect(q('#root').dataset['variant']).toBe('ghost');
      expect(q('#root').dataset['size']).toBe('md');
    });
  });

  describe('type', () => {
    it('defaults a button host to type="button" and keeps submit and bound values', () => {
      const { fixture, host, q } = render(TypeHost);
      expect(q('#default').getAttribute('type')).toBe('button');
      expect(q('#submit').getAttribute('type')).toBe('submit');
      expect(q('#bound-type').getAttribute('type')).toBe('reset');
      host.type.set(undefined);
      fixture.detectChanges();
      expect(q('#bound-type').getAttribute('type')).toBe('button');
    });

    it('renders no type on an anchor host', () => {
      const { q } = render(TypeHost);
      expect(q('#anchor').hasAttribute('type')).toBe(false);
    });
  });

  describe('disabled', () => {
    it('renders aria-disabled and keeps the element focusable', () => {
      const { q } = render(DisabledHost);
      const btn = q('#btn');
      expect(btn.getAttribute('aria-disabled')).toBe('true');
      expect(btn.hasAttribute('disabled')).toBe(false);
      btn.focus();
      expect(document.activeElement).toBe(btn);
    });

    it('strips a static disabled attribute into aria-disabled', () => {
      const { q } = render(DisabledHost);
      const btn = q('#static-disabled');
      expect(btn.hasAttribute('disabled')).toBe(false);
      expect(btn.getAttribute('aria-disabled')).toBe('true');
    });

    it('swallows click and auxclick while disabled', () => {
      const { host, q } = render(DisabledHost);
      const btn = q('#btn');
      const click = new MouseEvent('click', { bubbles: true, cancelable: true });
      btn.dispatchEvent(click);
      btn.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
      expect(host.clicks).toBe(0);
      expect(host.auxClicks).toBe(0);
      expect(click.defaultPrevented).toBe(true);
    });

    it('swallows a click that starts on the label', () => {
      const { host, q } = render(DisabledHost);
      (q('#btn .cngx-button__label') as HTMLElement).click();
      expect(host.clicks).toBe(0);
    });

    it('lets clicks through once enabled', () => {
      const { fixture, host, q } = render(DisabledHost);
      host.disabled.set(false);
      fixture.detectChanges();
      q('#btn').click();
      expect(host.clicks).toBe(1);
      expect(q('#btn').hasAttribute('aria-disabled')).toBe(false);
    });

    it('references the reason only while disabled and a reason exists', () => {
      const { fixture, host, q } = render(DisabledHost);
      const btn = q('#btn');
      const id = btn.getAttribute('aria-describedby');
      expect(id).toBeTruthy();
      const target = document.getElementById(id ?? '');
      expect(target?.textContent?.trim()).toBe('You need edit rights');
      expect(target?.hidden).toBe(true);

      host.reason.set(undefined);
      fixture.detectChanges();
      expect(btn.hasAttribute('aria-describedby')).toBe(false);

      host.reason.set('Locked');
      host.disabled.set(false);
      fixture.detectChanges();
      expect(btn.hasAttribute('aria-describedby')).toBe(false);
      expect(btn.querySelector('.cngx-button__reason')).not.toBeNull();
    });

    it('keeps the hidden reason out of the accessible name', () => {
      const { q } = render(DisabledHost);
      const label = q('#btn .cngx-button__label') as HTMLElement;
      expect(label.textContent?.trim()).toBe('Delete');
      expect((q('#btn .cngx-button__reason') as HTMLElement).hidden).toBe(true);
    });

    it('blocks RouterLink navigation on a disabled anchor', async () => {
      TestBed.configureTestingModule({
        providers: [provideRouter([{ path: 'next', children: [] }])],
      });
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigateByUrl');
      const { fixture, host, q } = render(RouterHost);
      const link = q<HTMLAnchorElement>('#link');

      const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
      link.dispatchEvent(click);
      expect(navigate).not.toHaveBeenCalled();
      expect(click.defaultPrevented).toBe(true);
      expect(link.getAttribute('aria-disabled')).toBe('true');

      host.disabled.set(false);
      fixture.detectChanges();
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
      expect(navigate).toHaveBeenCalledTimes(1);
      await fixture.whenStable();
    });

    it('blocks the form submit that implicit submission routes through the default button', () => {
      const { fixture, host, q } = render(FormHost);
      const submit = q('#submit');
      // Implicit submission (Enter in a field) fires a synthetic click on the
      // form's default button; cancelling that click cancels the submit.
      submit.click();
      expect(host.submits).toBe(0);

      host.disabled.set(false);
      fixture.detectChanges();
      submit.click();
      expect(host.submits).toBe(1);
    });
  });

  describe('co-hosted CngxAsyncClick', () => {
    it('renders aria-disabled in both attribute orders and blocks the action', () => {
      const { host, q } = render(AsyncHost);
      for (const id of ['#button-first', '#click-first']) {
        expect(q(id).getAttribute('aria-disabled')).toBe('true');
        q(id).click();
      }
      expect(host.calls).toBe(0);
    });

    it('shows the busy layer while the action runs and keeps the label', async () => {
      const { fixture, host, q } = render(AsyncHost);
      host.disabled.set(false);
      fixture.detectChanges();
      const btn = q('#button-first');
      expect(btn.hasAttribute('aria-disabled')).toBe(false);
      expect(btn.querySelector('.cngx-button__busy')).toBeNull();

      btn.click();
      fixture.detectChanges();
      expect(host.calls).toBe(1);
      expect(btn.dataset['busy']).toBe('true');
      expect(btn.getAttribute('aria-disabled')).toBe('true');
      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(btn.querySelector('.cngx-button__busy')?.getAttribute('aria-hidden')).toBe('true');
      expect(btn.querySelector('.cngx-button__label')?.textContent?.trim()).toBe('A');

      host.release();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(btn.hasAttribute('data-busy')).toBe(false);
      expect(btn.querySelector('.cngx-button__busy')).toBeNull();
    });
  });

  describe('slots', () => {
    it('flags filled start and end slots on the host', () => {
      const { q } = render(SlotHost);
      expect(q('#slots').hasAttribute('data-start')).toBe(true);
      expect(q('#slots').hasAttribute('data-end')).toBe(true);
      expect(q('#plain').hasAttribute('data-start')).toBe(false);
      expect(q('#plain').hasAttribute('data-end')).toBe(false);
    });
  });
});
