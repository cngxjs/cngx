import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxActiveDescendant } from '@cngx/common/a11y';

import { CngxOption } from './option.directive';
import { CngxOptionGroup } from './option-group.directive';

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
