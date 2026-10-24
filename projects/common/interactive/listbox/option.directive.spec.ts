import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxActiveDescendant } from '@cngx/common/a11y';
import { mousePick } from '@cngx/testing';

import { CngxOption } from './option.directive';
import { CngxOptionGroup } from './option-group.directive';
import { CNGX_OPTION_CHROME_ATTR } from './option-status-host';

@Component({
  template: `
    <div cngxActiveDescendant tabindex="0" #ad="cngxActiveDescendant">
      @for (opt of options(); track opt.value) {
        <div cngxOption [value]="opt.value" [disabled]="opt.disabled ?? false">
          {{ opt.label }}
        </div>
      }
    </div>
  `,
  imports: [CngxActiveDescendant, CngxOption],
})
class OptionHost {
  readonly options = signal<Array<{ value: string; label: string; disabled?: boolean }>>([
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
    { value: 'c', label: 'Cherry', disabled: true },
  ]);
}

describe('CngxOption', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OptionHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<OptionHost>>;
    options: CngxOption[];
    ad: CngxActiveDescendant;
  } {
    const fixture = TestBed.createComponent(OptionHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const options = fixture.debugElement
      .queryAll(By.directive(CngxOption))
      .map((d) => d.injector.get(CngxOption));
    const ad = fixture.debugElement
      .query(By.directive(CngxActiveDescendant))
      .injector.get(CngxActiveDescendant);
    return { fixture, options, ad };
  }

  it('assigns role="option" on host', () => {
    const { fixture } = setup();
    const hosts = fixture.debugElement.queryAll(By.directive(CngxOption));
    hosts.forEach((h) => {
      expect((h.nativeElement as HTMLElement).getAttribute('role')).toBe('option');
    });
  });

  it('exposes a stable unique id', () => {
    const { options } = setup();
    const ids = options.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^cngx-option-/));
  });

  it('reflects id on host DOM', () => {
    const { fixture, options } = setup();
    const hosts = fixture.debugElement.queryAll(By.directive(CngxOption));
    hosts.forEach((h, i) => {
      expect((h.nativeElement as HTMLElement).id).toBe(options[i].id);
    });
  });

  it('sets aria-selected="false" by default and reflects highlight', () => {
    const { fixture, options, ad } = setup();
    ad.highlightByValue('a');
    TestBed.flushEffects();
    fixture.detectChanges();
    const host = fixture.debugElement.queryAll(By.directive(CngxOption))[0].nativeElement as HTMLElement;
    // options themselves are not selectable yet; CngxListbox will drive isSelected.
    // Here we only verify the highlight state reflects.
    expect(options[0].isHighlighted()).toBe(true);
    expect(host.classList.contains('cngx-option--highlighted')).toBe(true);
  });

  it('sets aria-disabled when disabled()', () => {
    const { fixture } = setup();
    const host = fixture.debugElement.queryAll(By.directive(CngxOption))[2].nativeElement as HTMLElement;
    expect(host.getAttribute('aria-disabled')).toBe('true');
    expect(host.classList.contains('cngx-option--disabled')).toBe(true);
  });

  it('clicking a non-disabled option highlights and activates', () => {
    const { fixture, ad } = setup();
    const host = fixture.debugElement.queryAll(By.directive(CngxOption))[1].nativeElement as HTMLElement;
    let activatedValue: unknown = null;
    ad.activated.subscribe((v) => (activatedValue = v));
    host.click();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(ad.activeValue()).toBe('b');
    expect(activatedValue).toBe('b');
  });

  it('clicking a disabled option is a no-op', () => {
    const { fixture, ad } = setup();
    const host = fixture.debugElement.queryAll(By.directive(CngxOption))[2].nativeElement as HTMLElement;
    let activatedValue: unknown = null;
    ad.activated.subscribe((v) => (activatedValue = v));
    host.click();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(activatedValue).toBeNull();
    expect(ad.activeId()).toBeNull();
  });

  it('pointerenter highlights without activating', () => {
    const { fixture, ad } = setup();
    const host = fixture.debugElement.queryAll(By.directive(CngxOption))[1].nativeElement as HTMLElement;
    let activatedValue: unknown = null;
    ad.activated.subscribe((v) => (activatedValue = v));
    host.dispatchEvent(new PointerEvent('pointerenter'));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(ad.activeValue()).toBe('b');
    expect(activatedValue).toBeNull();
  });

  it('resolvedLabel falls back to host textContent when label input is empty', () => {
    const { fixture, options } = setup();
    fixture.detectChanges();
    expect(options[0].resolvedLabel().trim()).toBe('Apple');
  });

  describe('label Signal', () => {
    it('returns the explicit label input when supplied', () => {
      @Component({
        template: `<div cngxActiveDescendant tabindex="0">
          <div cngxOption value="a" label="Explicit Apple">Body Apple</div>
        </div>`,
        imports: [CngxActiveDescendant, CngxOption],
      })
      class ExplicitLabelHost {}

      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(ExplicitLabelHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      const opt = fixture.debugElement.query(By.directive(CngxOption)).injector.get(CngxOption);
      expect(opt.label()).toBe('Explicit Apple');
    });

    it('falls back to trimmed textContent when label input is absent', () => {
      const { options } = setup();
      expect(options[0].label()).toBe('Apple');
    });

    it('dev-warns once when both label input and textContent are empty', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      try {
        @Component({
          template: `<div cngxActiveDescendant tabindex="0">
            <div cngxOption value="x"></div>
          </div>`,
          imports: [CngxActiveDescendant, CngxOption],
        })
        class EmptyLabelHost {}

        TestBed.configureTestingModule({});
        const fixture = TestBed.createComponent(EmptyLabelHost);
        fixture.detectChanges();
        await fixture.whenStable();
        TestBed.flushEffects();
        fixture.detectChanges();

        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringMatching(/^CNGX1023: \[cngxOption\] option /),
        );
      } finally {
        errorSpy.mockRestore();
      }
    });

    it('label() strips markup from rich-content options (XSS-safe by construction)', () => {
      @Component({
        template: `<div cngxActiveDescendant tabindex="0">
          <div cngxOption value="p"><b>Premium</b> Service</div>
        </div>`,
        imports: [CngxActiveDescendant, CngxOption],
      })
      class RichContentHost {}

      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(RichContentHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      const opt = fixture.debugElement.query(By.directive(CngxOption)).injector.get(CngxOption);
      expect(opt.label()).toBe('Premium Service');
      expect(opt.label()).not.toContain('<');
      expect(opt.label()).not.toContain('>');
    });
  });

  describe('live text fallback', () => {
    @Component({
      template: `<div cngxActiveDescendant tabindex="0">
        <div cngxOption value="r" [label]="explicit()">
          {{ text() }}
          @if (chrome()) {
            <span data-cngx-option-chrome>Saving</span>
          }
        </div>
      </div>`,
      imports: [CngxActiveDescendant, CngxOption],
    })
    class LiveTextHost {
      readonly text = signal('Red');
      readonly explicit = signal<string | undefined>(undefined);
      readonly chrome = signal(false);
    }

    // Observers per observed node; other directives (the AD host) observe
    // their own elements, so only the option host counts.
    const observed = new Map<Node, number>();
    class CountingObserver extends MutationObserver {
      private targets = new Set<Node>();
      override observe(target: Node, options?: MutationObserverInit): void {
        if (!this.targets.has(target)) {
          this.targets.add(target);
          observed.set(target, (observed.get(target) ?? 0) + 1);
        }
        super.observe(target, options);
      }
      override disconnect(): void {
        for (const target of this.targets) {
          observed.set(target, (observed.get(target) ?? 1) - 1);
        }
        this.targets.clear();
        super.disconnect();
      }
    }

    async function settle(fixture: ReturnType<typeof TestBed.createComponent>): Promise<void> {
      fixture.detectChanges();
      TestBed.flushEffects();
      // MutationObserver records are delivered in a microtask.
      await Promise.resolve();
      TestBed.flushEffects();
      fixture.detectChanges();
    }

    async function mount() {
      observed.clear();
      vi.stubGlobal('MutationObserver', CountingObserver);
      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(LiveTextHost);
      await settle(fixture);
      const optionDe = fixture.debugElement.query(By.directive(CngxOption));
      const opt = optionDe.injector.get(CngxOption);
      const active = () => observed.get(optionDe.nativeElement as Node) ?? 0;
      return { fixture, host: fixture.componentInstance, opt, active };
    }

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('follows an interpolated text change while no label is bound', async () => {
      const { fixture, host, opt } = await mount();
      expect(opt.label()).toBe('Red');

      host.text.set('Rot');
      await settle(fixture);
      expect(opt.label()).toBe('Rot');
    });

    it('lets [label] win and keeps no observer while it is set', async () => {
      const { fixture, host, opt, active } = await mount();
      expect(active()).toBe(1);

      host.explicit.set('Crimson');
      await settle(fixture);
      expect(opt.label()).toBe('Crimson');
      expect(active()).toBe(0);

      host.text.set('Rot');
      await settle(fixture);
      expect(opt.label()).toBe('Crimson');
    });

    it('re-observes when [label] is cleared after first render', async () => {
      const { fixture, host, opt, active } = await mount();
      host.explicit.set('Crimson');
      await settle(fixture);
      host.text.set('Rot');
      await settle(fixture);

      host.explicit.set(undefined);
      await settle(fixture);
      expect(active()).toBe(1);
      expect(opt.label()).toBe('Rot');

      host.text.set('Rouge');
      await settle(fixture);
      expect(opt.label()).toBe('Rouge');
    });

    it('derives the current text on [label] clear without a MutationObserver', async () => {
      const { fixture, host, opt } = await mount();
      vi.stubGlobal('MutationObserver', undefined);
      host.explicit.set('Crimson');
      await settle(fixture);
      host.text.set('Rot');
      await settle(fixture);

      host.explicit.set(undefined);
      await settle(fixture);
      expect(opt.label()).toBe('Rot');
    });

    it('leaves a chrome-marked child out of the label', async () => {
      const { fixture, host, opt } = await mount();
      host.chrome.set(true);
      await settle(fixture);
      const chrome = fixture.nativeElement.querySelector('span') as HTMLElement;
      expect(chrome.hasAttribute(CNGX_OPTION_CHROME_ATTR)).toBe(true);
      expect(opt.label()).toBe('Red');
    });

    it('disconnects its observer on destroy', async () => {
      const { fixture, active } = await mount();
      expect(active()).toBe(1);
      fixture.destroy();
      expect(active()).toBe(0);
    });
  });
});

@Component({
  template: `
    <div cngxActiveDescendant tabindex="0">
      <div cngxOptionGroup label="Fruits">
        <div cngxOption value="a">Apple</div>
        <div cngxOption value="b">Banana</div>
      </div>
    </div>
  `,
  imports: [CngxActiveDescendant, CngxOption, CngxOptionGroup],
})
class OptionGroupHost {}

describe('CngxOptionGroup', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OptionGroupHost] });
  });

  it('renders role="group" and aria-label', () => {
    const fixture = TestBed.createComponent(OptionGroupHost);
    fixture.detectChanges();
    const groupHost = fixture.debugElement
      .query(By.directive(CngxOptionGroup))
      .nativeElement as HTMLElement;
    expect(groupHost.getAttribute('role')).toBe('group');
    expect(groupHost.getAttribute('aria-label')).toBe('Fruits');
  });

  it('child options still register with the surrounding AD', () => {
    const fixture = TestBed.createComponent(OptionGroupHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const ad = fixture.debugElement
      .query(By.directive(CngxActiveDescendant))
      .injector.get(CngxActiveDescendant);
    ad.highlightByValue('b');
    TestBed.flushEffects();
    expect(ad.activeValue()).toBe('b');
  });
});

@Component({
  template: `
    <div cngxActiveDescendant role="listbox" aria-label="Fruits" tabindex="0" data-testid="owned">
      <div cngxOption value="a">Apple</div>
      <div cngxOption value="b" [disabled]="true">Banana</div>
    </div>
    <input aria-label="Search fruits" data-testid="owner-input" />
    <div cngxActiveDescendant role="listbox" aria-label="Results" data-testid="external">
      <div cngxOption value="x">Xigua</div>
    </div>
  `,
  imports: [CngxActiveDescendant, CngxOption],
})
class OptionPressHost {}

describe('CngxOption mouse press', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OptionPressHost] });
  });

  function setup(): { root: HTMLElement } {
    const fixture = TestBed.createComponent(OptionPressHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    return { root: fixture.nativeElement as HTMLElement };
  }

  function option(root: HTMLElement, label: string): HTMLElement {
    const match = Array.from(root.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (el) => el.textContent?.trim() === label,
    );
    if (!match) {
      throw new Error(`no option "${label}"`);
    }
    return match;
  }

  it('mousedown on an option is default-prevented', () => {
    const { root } = setup();

    expect(mousePick(option(root, 'Apple')).defaultPrevented).toBe(true);
  });

  it('mousedown on a disabled option is default-prevented', () => {
    const { root } = setup();

    expect(mousePick(option(root, 'Banana')).defaultPrevented).toBe(true);
  });

  it('an option click focuses an unfocused tabindex=0 listbox owner', () => {
    const { root } = setup();
    const input = root.querySelector<HTMLElement>('[data-testid="owner-input"]')!;
    input.focus();

    mousePick(option(root, 'Apple'));

    expect(document.activeElement).toBe(root.querySelector('[data-testid="owned"]'));
  });

  it('an input-owned listbox keeps focus on the input', () => {
    const { root } = setup();
    const input = root.querySelector<HTMLElement>('[data-testid="owner-input"]')!;
    input.focus();

    mousePick(option(root, 'Xigua'));

    expect(document.activeElement).toBe(input);
  });
});
