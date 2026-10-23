import { Component, signal, type Type, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxTooltip } from '@cngx/common/popover';
import { createMatchMediaMock } from '@cngx/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxButton } from './button.component';
import { CngxIconButton } from './icon-button.component';

interface DescribedHost {
  readonly disabled: WritableSignal<boolean>;
  readonly reason: WritableSignal<string | undefined>;
}

@Component({
  template: `
    <span id="hint">Opens in a dialog</span>
    <button
      id="btn"
      cngxButton
      aria-describedby="hint"
      cngxTooltip="Edit the record"
      [disabled]="disabled()"
      [disabledReason]="reason()"
    >
      Edit
    </button>
  `,
  imports: [CngxButton, CngxTooltip],
})
class ButtonFirstHost implements DescribedHost {
  readonly disabled = signal(false);
  readonly reason = signal<string | undefined>('Read-only record');
}

@Component({
  template: `
    <span id="hint">Opens in a dialog</span>
    <button
      id="btn"
      cngxTooltip="Edit the record"
      [disabledReason]="reason()"
      [disabled]="disabled()"
      aria-describedby="hint"
      cngxButton
    >
      Edit
    </button>
  `,
  imports: [CngxButton, CngxTooltip],
})
class TooltipFirstHost implements DescribedHost {
  readonly disabled = signal(false);
  readonly reason = signal<string | undefined>('Read-only record');
}

@Component({
  template: `
    <span id="hint">Removes the row</span>
    <button
      id="btn"
      cngxIconButton
      aria-label="Delete row"
      aria-describedby="hint"
      cngxTooltip="Delete row"
      [disabled]="disabled()"
      [disabledReason]="reason()"
    >
      x
    </button>
  `,
  imports: [CngxIconButton, CngxTooltip],
})
class IconButtonFirstHost implements DescribedHost {
  readonly disabled = signal(false);
  readonly reason = signal<string | undefined>('Read-only record');
}

@Component({
  template: `
    <span id="hint">Removes the row</span>
    <button
      id="btn"
      cngxTooltip="Delete row"
      [disabledReason]="reason()"
      [disabled]="disabled()"
      aria-describedby="hint"
      aria-label="Delete row"
      cngxIconButton
    >
      x
    </button>
  `,
  imports: [CngxIconButton, CngxTooltip],
})
class TooltipFirstIconHost implements DescribedHost {
  readonly disabled = signal(false);
  readonly reason = signal<string | undefined>('Read-only record');
}

@Component({
  template: `
    <button
      id="btn"
      cngxIconButton
      aria-label="Delete row"
      cngxTooltip="Delete row"
      disabled
      disabledReason="Read only"
    >
      x
    </button>
  `,
  imports: [CngxIconButton, CngxTooltip],
})
class NoStaticHost {}

const CASES: readonly (readonly [string, Type<DescribedHost>])[] = [
  ['CngxButton, button attribute first', ButtonFirstHost],
  ['CngxButton, tooltip attribute first', TooltipFirstHost],
  ['CngxIconButton, button attribute first', IconButtonFirstHost],
  ['CngxIconButton, tooltip attribute first', TooltipFirstIconHost],
];

function render<T>(type: Type<T>) {
  const fixture = TestBed.createComponent(type);
  fixture.detectChanges();
  TestBed.flushEffects();
  const btn = (fixture.nativeElement as HTMLElement).querySelector('#btn') as HTMLButtonElement;
  const ids = () => (btn.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
  const tooltipId = () => btn.parentElement!.querySelector('[role="tooltip"]')!.id;
  const reasonId = () => btn.querySelector('.cngx-button__reason')!.id;
  return { fixture, host: fixture.componentInstance, btn, ids, tooltipId, reasonId };
}

describe('button family aria-describedby with a co-hosted cngxTooltip', () => {
  beforeEach(() => {
    createMatchMediaMock().install(window);
  });

  for (const [label, hostType] of CASES) {
    it(`keeps the static id, the tooltip id and the gated reason id (${label})`, () => {
      const { fixture, host, ids, tooltipId, reasonId } = render(hostType);
      const tip = tooltipId();
      const reason = reasonId();

      expect(ids()).toEqual(['hint', tip]);

      host.disabled.set(true);
      fixture.detectChanges();
      expect(ids()).toEqual(['hint', reason, tip]);

      host.reason.set(undefined);
      fixture.detectChanges();
      expect(ids()).toEqual(['hint', tip]);

      host.reason.set('Locked');
      fixture.detectChanges();
      expect(ids()).toEqual(['hint', reason, tip]);

      host.disabled.set(false);
      fixture.detectChanges();
      expect(ids()).toEqual(['hint', tip]);
    });
  }

  it('references the reason and the tooltip on a disabled icon button without a static id', () => {
    const { btn, ids, tooltipId, reasonId } = render(NoStaticHost);
    expect(ids()).toEqual([reasonId(), tooltipId()]);
    expect(document.getElementById(reasonId())?.textContent?.trim()).toBe('Read only');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
  });
});

interface DynamicHost extends DescribedHost {
  readonly extra: WritableSignal<string | null>;
}

@Component({
  template: `
    <span id="hint">Opens in a dialog</span>
    <span id="dyn-a">Last saved 2 min ago</span>
    <span id="dyn-b">Unsaved changes</span>
    <button
      id="btn"
      cngxButton
      aria-describedby="hint"
      cngxTooltip="Edit the record"
      [cngxDescribedBy]="extra()"
      [disabled]="disabled()"
      [disabledReason]="reason()"
    >
      Edit
    </button>
  `,
  imports: [CngxButton, CngxTooltip],
})
class DynamicButtonHost implements DynamicHost {
  readonly extra = signal<string | null>('dyn-a');
  readonly disabled = signal(false);
  readonly reason = signal<string | undefined>('Read-only record');
}

@Component({
  template: `
    <span id="hint">Removes the row</span>
    <span id="dyn-a">Last saved 2 min ago</span>
    <span id="dyn-b">Unsaved changes</span>
    <button
      id="btn"
      cngxTooltip="Delete row"
      [disabledReason]="reason()"
      [disabled]="disabled()"
      [cngxDescribedBy]="extra()"
      aria-describedby="hint"
      aria-label="Delete row"
      cngxIconButton
    >
      x
    </button>
  `,
  imports: [CngxIconButton, CngxTooltip],
})
class DynamicIconButtonHost implements DynamicHost {
  readonly extra = signal<string | null>('dyn-a');
  readonly disabled = signal(false);
  readonly reason = signal<string | undefined>('Read-only record');
}

@Component({
  template: `<button id="btn" cngxButton [cngxDescribedBy]="extra()">Save</button>`,
  imports: [CngxButton],
})
class DynamicOnlyHost {
  readonly extra = signal<string | null>(null);
}

const DYNAMIC_CASES: readonly (readonly [string, Type<DynamicHost>])[] = [
  ['CngxButton', DynamicButtonHost],
  ['CngxIconButton', DynamicIconButtonHost],
];

describe('button family [cngxDescribedBy]', () => {
  beforeEach(() => {
    createMatchMediaMock().install(window);
  });

  for (const [label, hostType] of DYNAMIC_CASES) {
    it(`orders static id, input ids, reason, tooltip and follows changes (${label})`, () => {
      const { fixture, host, ids, tooltipId, reasonId } = render(hostType);
      const tip = tooltipId();
      const reason = reasonId();

      expect(ids()).toEqual(['hint', 'dyn-a', tip]);

      host.extra.set('dyn-a dyn-b');
      fixture.detectChanges();
      expect(ids()).toEqual(['hint', 'dyn-a', 'dyn-b', tip]);

      host.disabled.set(true);
      fixture.detectChanges();
      expect(ids()).toEqual(['hint', 'dyn-a', 'dyn-b', reason, tip]);

      host.extra.set('dyn-b');
      fixture.detectChanges();
      expect(ids()).toEqual(['hint', 'dyn-b', reason, tip]);

      host.extra.set(null);
      fixture.detectChanges();
      expect(ids()).toEqual(['hint', reason, tip]);

      host.disabled.set(false);
      fixture.detectChanges();
      expect(ids()).toEqual(['hint', tip]);
    });
  }

  it('adds and removes the attribute when the input ids are the only description', () => {
    const fixture = TestBed.createComponent(DynamicOnlyHost);
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('#btn') as HTMLButtonElement;
    expect(btn.hasAttribute('aria-describedby')).toBe(false);

    fixture.componentInstance.extra.set('external-hint');
    fixture.detectChanges();
    expect(btn.getAttribute('aria-describedby')).toBe('external-hint');

    fixture.componentInstance.extra.set(null);
    fixture.detectChanges();
    expect(btn.hasAttribute('aria-describedby')).toBe(false);
  });
});
