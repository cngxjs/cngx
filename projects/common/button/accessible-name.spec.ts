import { afterNextRender, Component, inject, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { hasAccessibleName } from './accessible-name';
import { CngxButtonBrain } from './button-brain.directive';
import { provideButtonHost } from './button-host.token';

// Icon-only custom host: glyph hidden, reason in a hidden span, like the icon button.
@Component({
  selector: 'button[demoIcon]',
  hostDirectives: [{ directive: CngxButtonBrain, inputs: ['disabled', 'disabledReason'] }],
  providers: [provideButtonHost('DemoIcon', { defaultVariant: 'ghost', iconOnly: true })],
  template: `
    <span aria-hidden="true"><ng-content /></span>
    @if (srLabel()) {
      <span class="cngx-sr-only">{{ srLabel() }}</span>
    }
    <span [id]="brain.reasonId" hidden>{{ brain.disabledReason() }}</span>
  `,
})
class DemoIcon {
  readonly srLabel = input<string | undefined>(undefined);
  protected readonly brain = inject(CngxButtonBrain);
}

@Component({
  template: `<button id="late" demoIcon [attr.aria-label]="label()">x</button>`,
  imports: [DemoIcon],
})
class LateLabelHost {
  readonly label = signal<string | null>(null);
  constructor() {
    afterNextRender(() => this.label.set('Delete row'));
  }
}

@Component({
  template: `<button id="unnamed" demoIcon>x</button>`,
  imports: [DemoIcon],
})
class UnnamedHost {}

@Component({
  template: `<button id="reasoned" demoIcon disabled disabledReason="Saving">x</button>`,
  imports: [DemoIcon],
})
class ReasonOnlyHost {}

@Component({
  template: `<button id="sr" demoIcon srLabel="Delete row">x</button>`,
  imports: [DemoIcon],
})
class SrLabelHost {}

async function warningsFor<T>(type: new () => T): Promise<unknown[][]> {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const fixture = TestBed.createComponent(type);
  fixture.detectChanges();
  await fixture.whenStable();
  // The check itself waits for the app to be stable, one turn after the fixture.
  await new Promise((resolve) => setTimeout(resolve));
  const calls = warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1071'));
  warn.mockRestore();
  return calls;
}

describe('CNGX1071 accessible-name check', () => {
  it('raises no warning for a label bound after the first render', async () => {
    expect(await warningsFor(LateLabelHost)).toEqual([]);
  });

  it('warns once for an unnamed icon-only host, naming the host', async () => {
    const calls = await warningsFor(UnnamedHost);
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toMatch(/^CNGX1071: DemoIcon has no accessible name\./);
  });

  it('still warns when the only text is the hidden disabled reason', async () => {
    expect(await warningsFor(ReasonOnlyHost)).toHaveLength(1);
  });

  it('counts sr-only content as a name', async () => {
    expect(await warningsFor(SrLabelHost)).toEqual([]);
  });
});

describe('hasAccessibleName', () => {
  const el = (html: string): HTMLElement => {
    const host = document.createElement('button');
    host.innerHTML = html;
    return host;
  };

  it('accepts a non-blank aria-label, aria-labelledby or title', () => {
    for (const attr of ['aria-label', 'aria-labelledby', 'title']) {
      const host = el('');
      host.setAttribute(attr, 'x');
      expect(hasAccessibleName(host)).toBe(true);
    }
    const blank = el('');
    blank.setAttribute('aria-label', '  ');
    expect(hasAccessibleName(blank)).toBe(false);
  });

  it('accepts text outside aria-hidden and hidden subtrees only', () => {
    expect(hasAccessibleName(el('<span aria-hidden="true">x</span>'))).toBe(false);
    expect(hasAccessibleName(el('<span hidden>Saving</span>'))).toBe(false);
    expect(hasAccessibleName(el('<span><b aria-hidden="true">x</b> </span>'))).toBe(false);
    expect(hasAccessibleName(el('<span class="cngx-sr-only">More</span>'))).toBe(true);
    expect(hasAccessibleName(el('Save'))).toBe(true);
  });
});
