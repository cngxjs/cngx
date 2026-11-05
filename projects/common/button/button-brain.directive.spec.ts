import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CNGX_HOST_INTERACTION_STATE, CngxAsyncClick } from '@cngx/common/interactive';
import { describe, expect, it, vi } from 'vitest';

import { CngxButtonBrain } from './button-brain.directive';
import {
  provideButtonConfig,
  withButtonSize,
  withButtonTone,
  withButtonVariant,
} from './button-config';
import { CngxButtonGroup } from './button-group.directive';
import { CNGX_BUTTON_HOST_STATE, provideButtonHost } from './button-host.token';
import { CNGX_BUTTON_STATE } from './button-state.token';

const BRAIN_INPUTS = [
  'variant: demoChip',
  'tone',
  'size',
  'disabled',
  'disabledReason',
  'cngxDescribedBy',
  'type',
];

// A custom host: the brain plus a template, nothing else from the button entry.
@Component({
  selector: 'button[demoChip], a[demoChip]',
  hostDirectives: [{ directive: CngxButtonBrain, inputs: BRAIN_INPUTS }],
  providers: [provideButtonHost('demoChip', { defaultVariant: 'outline' })],
  template: `<ng-content /><span [id]="brain.reasonId" hidden>{{ brain.disabledReason() }}</span>`,
})
class DemoChip {
  protected readonly brain = inject(CngxButtonBrain);
}

@Component({
  selector: 'button[demoPinned]',
  hostDirectives: [{ directive: CngxButtonBrain, inputs: ['variant: demoPinned', 'tone', 'size'] }],
  providers: [
    provideButtonHost('demoPinned', {
      defaultVariant: 'ghost',
      fixed: { variant: 'ghost', size: 'sm', tone: 'neutral' },
    }),
  ],
  template: `<ng-content />`,
})
class DemoPinned {}

@Component({
  selector: 'button[demoStateful]',
  hostDirectives: [{ directive: CngxButtonBrain, inputs: ['disabled', 'disabledReason'] }],
  providers: [
    provideButtonHost('demoStateful', { defaultVariant: 'solid' }),
    { provide: CNGX_BUTTON_HOST_STATE, useFactory: () => inject(DemoStateful).hostState },
  ],
  template: `<ng-content /><span [id]="brain.reasonId" hidden>{{ brain.disabledReason() }}</span>`,
})
class DemoStateful {
  protected readonly brain = inject(CngxButtonBrain);
  readonly refusing = signal(false);
  readonly running = signal(false);
  readonly hostState = { refusing: this.refusing.asReadonly(), busy: this.running.asReadonly() };
}

// Reflects a run from the first render on, with or without a co-hosted runner.
@Component({
  selector: 'button[demoBusyOnly]',
  hostDirectives: [{ directive: CngxButtonBrain, inputs: ['disabled'] }],
  providers: [
    provideButtonHost('demoBusyOnly', { defaultVariant: 'solid' }),
    { provide: CNGX_BUTTON_HOST_STATE, useFactory: () => inject(DemoBusyOnly).hostState },
  ],
  template: `<ng-content />`,
})
class DemoBusyOnly {
  readonly running = signal(true);
  readonly hostState = { refusing: signal(false).asReadonly(), busy: this.running.asReadonly() };
}

@Component({
  template: `
    <button id="busy-only" demoBusyOnly (click)="clicks = clicks + 1">Sync</button>
    <button id="busy-runner" demoBusyOnly [cngxAsyncClick]="run">Sync</button>
  `,
  imports: [DemoBusyOnly, CngxAsyncClick],
})
class BusyOnlyHost {
  clicks = 0;
  readonly run = (): Promise<void> => Promise.resolve();
}

@Component({
  template: `
    <button
      id="chip"
      demoChip
      aria-describedby="static-id"
      [disabled]="disabled()"
      disabledReason="Saving"
      [cngxDescribedBy]="extra()"
      (click)="clicks = clicks + 1"
    >
      Chip
    </button>
    <a id="link" demoChip="link" href="#x">Link</a>
    <button id="toned" demoChip tone="danger" size="lg">Toned</button>
    <button id="async" demoChip [cngxAsyncClick]="run" [showDelay]="0" [minDwell]="0">Run</button>
  `,
  imports: [DemoChip, CngxAsyncClick],
})
class Host {
  readonly disabled = signal(false);
  readonly extra = signal<string | null>(null);
  clicks = 0;
  release: () => void = () => undefined;
  readonly run = (): Promise<void> => new Promise<void>((resolve) => (this.release = resolve));
}

@Component({
  template: `
    <div cngxButtonGroup variant="solid" size="lg" aria-label="Toolbar">
      <button id="pinned" demoPinned>Pinned</button>
      <button id="pinned-own" demoPinned="outline" tone="danger" size="md">Own</button>
      <button id="free" demoChip>Free</button>
    </div>
  `,
  imports: [DemoPinned, DemoChip, CngxButtonGroup],
})
class PinnedHost {}

@Component({
  template: `<button
    id="stateful"
    demoStateful
    disabledReason="Locked"
    (click)="clicks = clicks + 1"
  >
    Go
  </button>`,
  imports: [DemoStateful],
})
class StatefulHost {
  clicks = 0;
}

// A runner that refuses on its own: the host is not disabled, only cngxAsyncClick says no.
@Component({
  template: `
    <a
      id="refused-link"
      demoChip
      href="#refused"
      [cngxAsyncClick]="run"
      [enabled]="false"
      (click)="clicks = clicks + 1"
      >Open</a
    >
    <button
      id="refused-button"
      demoChip
      [cngxAsyncClick]="run"
      [enabled]="false"
      (click)="clicks = clicks + 1"
    >
      Run
    </button>
  `,
  imports: [DemoChip, CngxAsyncClick],
})
class RunnerRefusalHost {
  clicks = 0;
  runs = 0;
  readonly run = (): Promise<void> => {
    this.runs += 1;
    return Promise.resolve();
  };
}

function render<T>(type: new () => T) {
  const fixture = TestBed.createComponent(type);
  fixture.detectChanges();
  TestBed.flushEffects();
  const el = fixture.nativeElement as HTMLElement;
  const flush = () => {
    fixture.detectChanges();
    TestBed.flushEffects();
  };
  return {
    fixture,
    host: fixture.componentInstance,
    flush,
    q: (s: string) => el.querySelector(s) as HTMLElement,
  };
}

describe('CngxButtonBrain', () => {
  it('renders the axis contract on a custom host with the descriptor default', () => {
    const { q } = render(Host);
    expect(q('#chip').dataset['variant']).toBe('outline');
    expect(q('#chip').dataset['tone']).toBe('neutral');
    expect(q('#chip').dataset['size']).toBe('md');
    expect(q('#link').dataset['variant']).toBe('link');
    expect(q('#toned').dataset['tone']).toBe('danger');
    expect(q('#toned').dataset['size']).toBe('lg');
  });

  it('renders type="button" on a button and no type on an anchor', () => {
    const { q } = render(Host);
    expect(q('#chip').getAttribute('type')).toBe('button');
    expect(q('#link').hasAttribute('type')).toBe(false);
  });

  it('renders disabled as aria-disabled, references the reason and swallows clicks', () => {
    const { q, fixture, host, flush } = render(Host);
    const chip = q('#chip');
    expect(chip.getAttribute('aria-disabled')).toBeNull();
    expect(chip.getAttribute('aria-describedby')).toBe('static-id');

    host.disabled.set(true);
    host.extra.set('extra-id');
    flush();
    const reason = chip.querySelector('[hidden]') as HTMLElement;
    expect(chip.getAttribute('aria-disabled')).toBe('true');
    expect(chip.hasAttribute('disabled')).toBe(false);
    expect(chip.getAttribute('aria-describedby')).toBe(`static-id extra-id ${reason.id}`);
    expect(reason.textContent).toBe('Saving');
    // One source: the published id is the one aria-describedby references.
    const brain = fixture.debugElement.query(By.css('#chip')).injector.get(CngxButtonBrain);
    expect(brain.activeReasonId()).toBe(reason.id);

    chip.click();
    expect(host.clicks).toBe(0);
  });

  it('publishes CNGX_BUTTON_STATE and CNGX_HOST_INTERACTION_STATE from the brain', () => {
    const { fixture, host, flush } = render(Host);
    const de = fixture.debugElement.query(By.css('#chip'));
    const brain = de.injector.get(CngxButtonBrain);
    expect(de.injector.get(CNGX_BUTTON_STATE)).toBe(brain);
    const interaction = de.injector.get(CNGX_HOST_INTERACTION_STATE);
    expect(interaction).toBe(brain.interaction);
    expect([interaction.disabled(), brain.blocked()]).toEqual([false, false]);
    host.disabled.set(true);
    flush();
    expect([interaction.disabled(), brain.blocked()]).toEqual([true, true]);
    expect(brain.activeReasonId()).toBe(brain.reasonId);
  });

  it('follows a co-hosted cngxAsyncClick: data-pending at once, data-busy behind the gate', async () => {
    const { q, host, fixture, flush } = render(Host);
    const btn = q('#async');
    btn.click();
    flush();
    expect(btn.getAttribute('data-pending')).toBe('true');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    await new Promise((resolve) => setTimeout(resolve));
    flush();
    expect(btn.getAttribute('data-busy')).toBe('true');
    host.release();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
    flush();
    expect(btn.getAttribute('data-pending')).toBeNull();
    expect(btn.getAttribute('data-busy')).toBeNull();
    expect(btn.getAttribute('aria-disabled')).toBeNull();
  });

  it('pinned axes beat the group and the config; the input still wins', () => {
    TestBed.configureTestingModule({
      providers: [
        provideButtonConfig(
          withButtonVariant('secondary'),
          withButtonSize('xs'),
          withButtonTone('danger'),
        ),
      ],
    });
    const { q } = render(PinnedHost);
    expect(q('#pinned').dataset['variant']).toBe('ghost');
    expect(q('#pinned').dataset['size']).toBe('sm');
    expect(q('#pinned').dataset['tone']).toBe('neutral');
    expect(q('#pinned-own').dataset['variant']).toBe('outline');
    expect(q('#pinned-own').dataset['size']).toBe('md');
    expect(q('#pinned-own').dataset['tone']).toBe('danger');
    expect(q('#free').dataset['variant']).toBe('solid');
    expect(q('#free').dataset['size']).toBe('lg');
    expect(q('#free').dataset['tone']).toBe('danger');
  });

  it('CNGX_BUTTON_HOST_STATE.refusing blocks and guards without referencing the reason', () => {
    const { q, fixture, host, flush } = render(StatefulHost);
    const btn = q('#stateful');
    const de = fixture.debugElement.query(By.css('#stateful'));
    const demo = de.injector.get(DemoStateful);
    const brain = de.injector.get(CngxButtonBrain);
    const interaction = de.injector.get(CNGX_HOST_INTERACTION_STATE);

    demo.refusing.set(true);
    flush();
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.hasAttribute('aria-describedby')).toBe(false);
    expect(brain.activeReasonId()).toBeNull();
    expect(interaction.disabled()).toBe(true);
    btn.click();
    expect(host.clicks).toBe(0);

    demo.refusing.set(false);
    flush();
    btn.click();
    expect(host.clicks).toBe(1);
  });

  it('CNGX_BUTTON_HOST_STATE.busy sets data-pending and CNGX_HOST_INTERACTION_STATE.busy', () => {
    const { q, fixture, flush } = render(StatefulHost);
    const btn = q('#stateful');
    const de = fixture.debugElement.query(By.css('#stateful'));
    const demo = de.injector.get(DemoStateful);
    const interaction = de.injector.get(CNGX_HOST_INTERACTION_STATE);

    expect(btn.getAttribute('data-pending')).toBeNull();
    expect(interaction.busy?.()).toBe(false);
    demo.running.set(true);
    flush();
    expect(btn.getAttribute('data-pending')).toBe('true');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(interaction.busy?.()).toBe(true);
  });

  it('a busy-only host reads busy and disabled to assistive technology and refuses activation', () => {
    const { q, fixture, host, flush } = render(BusyOnlyHost);
    const btn = q('#busy-only');
    const demo = fixture.debugElement.query(By.css('#busy-only')).injector.get(DemoBusyOnly);

    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    btn.click();
    expect(host.clicks).toBe(0);

    demo.running.set(false);
    flush();
    expect(btn.hasAttribute('aria-busy')).toBe(false);
    expect(btn.hasAttribute('aria-disabled')).toBe(false);
    btn.click();
    expect(host.clicks).toBe(1);
  });

  it('a busy-only host and its co-hosted runner agree on aria-disabled and aria-busy', () => {
    const { q, fixture, flush } = render(BusyOnlyHost);
    const btn = q('#busy-runner');
    const de = fixture.debugElement.query(By.css('#busy-runner'));
    const interaction = de.injector.get(CNGX_HOST_INTERACTION_STATE);

    expect(interaction.disabled()).toBe(true);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.getAttribute('aria-busy')).toBe('true');

    de.injector.get(DemoBusyOnly).running.set(false);
    flush();
    expect(interaction.disabled()).toBe(false);
    expect(btn.hasAttribute('aria-disabled')).toBe(false);
    expect(btn.hasAttribute('aria-busy')).toBe(false);
  });

  describe('activation while aria-disabled', () => {
    it('a runner-only refusal stops co-located click listeners and the link default', () => {
      const { q, host } = render(RunnerRefusalHost);
      for (const id of ['#refused-link', '#refused-button']) {
        const el = q(id);
        expect(el.getAttribute('aria-disabled')).toBe('true');
        const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
        el.dispatchEvent(ev);
        expect(ev.defaultPrevented).toBe(true);
      }
      expect(host.clicks).toBe(0);
      expect(host.runs).toBe(0);
    });

    it('a pending run stops co-located click listeners until it settles', async () => {
      const { q, host, fixture, flush } = render(Host);
      const btn = q('#async');
      const listener = vi.fn();
      btn.addEventListener('click', listener);
      btn.click();
      flush();
      expect(listener).toHaveBeenCalledTimes(1);
      expect(btn.getAttribute('aria-disabled')).toBe('true');
      btn.click();
      expect(listener).toHaveBeenCalledTimes(1);
      host.release();
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();
      flush();
      expect(btn.hasAttribute('aria-disabled')).toBe(false);
      btn.click();
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });
});
