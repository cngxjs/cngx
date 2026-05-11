import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { CngxInputMask, type MaskTokenMap } from './input-mask.directive';

// ── Test host ───────────────────────────────────────────────────────

@Component({
  template: `<input
    [cngxInputMask]="mask()"
    [placeholder]="ph()"
    [guide]="guide()"
    [includeLiterals]="includeLiterals()"
    [prefix]="prefix()"
    [suffix]="suffix()"
    [transform]="transform()"
    [customTokens]="customTokens()"
  />`,
  imports: [CngxInputMask],
})
class Host {
  readonly mask = signal('(000) 000-0000');
  readonly ph = signal('_');
  readonly guide = signal(true);
  readonly includeLiterals = signal(false);
  readonly prefix = signal('');
  readonly suffix = signal('');
  readonly transform = signal<((ch: string) => string) | undefined>(undefined);
  readonly customTokens = signal<MaskTokenMap | undefined>(undefined);
  readonly directive = viewChild.required(CngxInputMask);
}

function setup(
  overrides: {
    mask?: string;
    ph?: string;
    guide?: boolean;
    includeLiterals?: boolean;
    prefix?: string;
    suffix?: string;
    transform?: (ch: string) => string;
    customTokens?: MaskTokenMap;
    locale?: string;
  } = {},
) {
  const providers = overrides.locale ? [{ provide: LOCALE_ID, useValue: overrides.locale }] : [];

  TestBed.configureTestingModule({ providers });
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  if (overrides.mask != null) host.mask.set(overrides.mask);
  if (overrides.ph != null) host.ph.set(overrides.ph);
  if (overrides.guide != null) host.guide.set(overrides.guide);
  if (overrides.includeLiterals != null) host.includeLiterals.set(overrides.includeLiterals);
  if (overrides.prefix != null) host.prefix.set(overrides.prefix);
  if (overrides.suffix != null) host.suffix.set(overrides.suffix);
  if (overrides.transform != null) host.transform.set(overrides.transform);
  if (overrides.customTokens != null) host.customTokens.set(overrides.customTokens);
  fixture.detectChanges();
  TestBed.flushEffects();

  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const directive = host.directive();
  return { fixture, input, directive };
}

function typeSequence(
  input: HTMLInputElement,
  chars: string,
  directive: CngxInputMask,
  fixture: ReturnType<typeof TestBed.createComponent>,
  ph = '_',
): void {
  for (const ch of chars) {
    const masked = directive.maskedValue();
    let pos = masked.indexOf(ph);
    if (pos === -1) pos = masked.length;
    input.setSelectionRange(pos, pos);
    input.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'insertText', data: ch, cancelable: true }),
    );
    fixture.detectChanges();
    TestBed.flushEffects();
  }
}

function deleteBackward(input: HTMLInputElement, cursorPos: number): void {
  input.setSelectionRange(cursorPos, cursorPos);
  input.dispatchEvent(
    new InputEvent('beforeinput', { inputType: 'deleteContentBackward', cancelable: true }),
  );
}

function deleteForward(input: HTMLInputElement, cursorPos: number): void {
  input.setSelectionRange(cursorPos, cursorPos);
  input.dispatchEvent(
    new InputEvent('beforeinput', { inputType: 'deleteContentForward', cancelable: true }),
  );
}

function pasteText(input: HTMLInputElement, text: string, cursorPos: number): void {
  input.setSelectionRange(cursorPos, cursorPos);
  const event = new Event('paste', { cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: () => text },
  });
  input.dispatchEvent(event);
}

function flush(fixture: ReturnType<typeof TestBed.createComponent>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

// ── Tests ───────────────────────────────────────────────────────────

describe('CngxInputMask', () => {
  // ── Basic mask behavior ─────────────────────────────────────────────

  describe('initial state', () => {
    it('should show guide placeholder on init', () => {
      const { input } = setup();
      expect(input.value).toBe('(___) ___-____');
    });

    it('should report isComplete as false when empty', () => {
      const { directive } = setup();
      expect(directive.isComplete()).toBe(false);
    });

    it('should report rawValue as empty string', () => {
      const { directive } = setup();
      expect(directive.rawValue()).toBe('');
    });
  });

  describe('typing character by character', () => {
    it('should insert digits and auto-insert literals', () => {
      const { input, directive, fixture } = setup();
      typeSequence(input, '1', directive, fixture);
      expect(directive.rawValue()).toBe('1');
      expect(input.value).toBe('(1__) ___-____');
    });

    it('should reject invalid characters for digit-only mask', () => {
      const { input, directive, fixture } = setup();
      input.setSelectionRange(1, 1);
      input.dispatchEvent(
        new InputEvent('beforeinput', { inputType: 'insertText', data: 'a', cancelable: true }),
      );
      flush(fixture);
      expect(directive.rawValue()).toBe('');
    });

    it('should complete the mask when all positions filled', () => {
      const { input, directive, fixture } = setup();
      typeSequence(input, '1234567890', directive, fixture);
      expect(directive.rawValue()).toBe('1234567890');
      expect(directive.isComplete()).toBe(true);
      expect(input.value).toBe('(123) 456-7890');
    });

    it('should ignore chars beyond mask capacity', () => {
      const { input, directive, fixture } = setup();
      typeSequence(input, '12345678901', directive, fixture);
      expect(directive.rawValue()).toBe('1234567890');
    });
  });

  describe('letter mask', () => {
    it('should accept letters for A token and digits for 0 token', () => {
      const { input, directive, fixture } = setup({ mask: 'AA-0000' });
      typeSequence(input, 'CH1234', directive, fixture);
      expect(directive.rawValue()).toBe('CH1234');
      expect(input.value).toBe('CH-1234');
      expect(directive.isComplete()).toBe(true);
    });

    it('should reject digits for A token', () => {
      const { input, directive, fixture } = setup({ mask: 'AA-0000' });
      input.setSelectionRange(0, 0);
      input.dispatchEvent(
        new InputEvent('beforeinput', { inputType: 'insertText', data: '1', cancelable: true }),
      );
      flush(fixture);
      expect(directive.rawValue()).toBe('');
    });
  });

  describe('mixed alphanumeric mask', () => {
    it('should handle * token', () => {
      const { input, directive, fixture } = setup({ mask: '***-***' });
      typeSequence(input, 'A1B2C3', directive, fixture);
      expect(directive.rawValue()).toBe('A1B2C3');
      expect(input.value).toBe('A1B-2C3');
      expect(directive.isComplete()).toBe(true);
    });
  });

  // ── Paste ───────────────────────────────────────────────────────────

  describe('paste', () => {
    it('should distribute valid chars across mask positions', () => {
      const { input, directive, fixture } = setup();
      pasteText(input, '1234567890', 0);
      flush(fixture);
      expect(directive.rawValue()).toBe('1234567890');
      expect(directive.isComplete()).toBe(true);
      expect(input.value).toBe('(123) 456-7890');
    });

    it('should skip invalid chars in pasted text', () => {
      const { input, directive, fixture } = setup();
      pasteText(input, '12abc34', 0);
      flush(fixture);
      expect(directive.rawValue()).toBe('1234');
    });

    it('should handle pasting more chars than slots', () => {
      const { input, directive, fixture } = setup({ mask: '000' });
      pasteText(input, '12345', 0);
      flush(fixture);
      expect(directive.rawValue()).toBe('123');
    });
  });

  // ── Delete ──────────────────────────────────────────────────────────

  describe('delete backward', () => {
    it('should delete the last entered character', () => {
      const { input, directive, fixture } = setup();
      typeSequence(input, '123', directive, fixture);
      expect(directive.rawValue()).toBe('123');
      deleteBackward(input, 4);
      flush(fixture);
      expect(directive.rawValue()).toBe('12');
    });

    it('should skip over literals when deleting backward', () => {
      const { input, directive, fixture } = setup();
      typeSequence(input, '1234', directive, fixture);
      deleteBackward(input, 5);
      flush(fixture);
      expect(directive.rawValue()).toBe('124');
    });
  });

  describe('delete forward', () => {
    it('should delete the character at cursor', () => {
      const { input, directive, fixture } = setup();
      typeSequence(input, '123', directive, fixture);
      deleteForward(input, 1);
      flush(fixture);
      expect(directive.rawValue()).toBe('23');
    });
  });

  // ── Mask change at runtime ──────────────────────────────────────────

  describe('mask change at runtime', () => {
    it('should reset rawValue when mask changes', () => {
      const { input, directive, fixture } = setup();
      typeSequence(input, '123', directive, fixture);
      expect(directive.rawValue()).toBe('123');

      fixture.componentInstance.mask.set('00-00');
      flush(fixture);
      expect(directive.rawValue()).toBe('');
      expect(input.value).toBe('__-__');
    });
  });

  // ── valueChange output ──────────────────────────────────────────────

  describe('valueChange output', () => {
    it('should emit rawValue on each change', () => {
      const { input, directive, fixture } = setup();
      const emitted: string[] = [];
      directive.valueChange.subscribe((v: string) => emitted.push(v));
      typeSequence(input, '12', directive, fixture);
      expect(emitted).toEqual(['1', '12']);
    });
  });

  // ── ARIA ────────────────────────────────────────────────────────────

  describe('aria', () => {
    it('should set aria-placeholder from mask pattern', () => {
      const { input } = setup();
      expect(input.getAttribute('aria-placeholder')).toBe('(___) ___-____');
    });

    it('should include prefix/suffix in aria-placeholder', () => {
      const { input } = setup({ mask: '000', prefix: 'CPF: ', suffix: ' BR' });
      expect(input.getAttribute('aria-placeholder')).toBe('CPF: ___ BR');
    });
  });

  // ── Prefix / Suffix ────────────────────────────────────────────────

  describe('prefix and suffix', () => {
    it('should prepend prefix and append suffix to display value', () => {
      const { input, directive, fixture } = setup({ mask: '000.000-00', prefix: 'CPF: ' });
      typeSequence(input, '12345678', directive, fixture);
      expect(input.value).toBe('CPF: 123.456-78');
      expect(directive.rawValue()).toBe('12345678');
    });

    it('should handle suffix', () => {
      const { input, directive, fixture } = setup({ mask: '000', suffix: ' kg' });
      typeSequence(input, '123', directive, fixture);
      expect(input.value).toBe('123 kg');
    });
  });

  // ── Transform ───────────────────────────────────────────────────────

  describe('transform', () => {
    it('should apply global transform to each character', () => {
      const { input, directive, fixture } = setup({
        mask: 'AAAA',
        transform: (c: string) => c.toUpperCase(),
      });
      typeSequence(input, 'abcd', directive, fixture);
      expect(directive.rawValue()).toBe('ABCD');
      expect(input.value).toBe('ABCD');
    });
  });

  // ── Custom tokens ──────────────────────────────────────────────────

  describe('custom tokens', () => {
    it('should accept custom token definitions', () => {
      const { input, directive, fixture } = setup({
        mask: '\\#HHHHHH',
        customTokens: { H: { pattern: /[0-9a-fA-F]/, transform: (c) => c.toUpperCase() } },
      });
      typeSequence(input, 'ff00aa', directive, fixture);
      expect(directive.rawValue()).toBe('FF00AA');
      expect(input.value).toBe('#FF00AA');
    });
  });

  // ── Presets ─────────────────────────────────────────────────────────

  describe('presets', () => {
    it('should resolve "date" preset for en locale', () => {
      const { input } = setup({ mask: 'date', locale: 'en-US' });
      expect(input.value).toBe('__/__/____');
    });

    it('should resolve "date" preset for de locale', () => {
      const { input } = setup({ mask: 'date', locale: 'de-DE' });
      expect(input.value).toBe('__/__/____');
    });

    it('should resolve "date" preset for ja locale (YYYY/MM/DD)', () => {
      const { input } = setup({ mask: 'date', locale: 'ja-JP' });
      expect(input.value).toBe('____/__/__');
    });

    it('should resolve "phone:CH" preset', () => {
      const { input } = setup({ mask: 'phone:CH' });
      expect(input.value).toBe('+__ __ ___ __ __');
    });

    it('should resolve "phone:US" preset', () => {
      const { input } = setup({ mask: 'phone:US' });
      expect(input.value).toBe('(___) ___-____');
    });

    it('should resolve "phone" from locale', () => {
      const { input } = setup({ mask: 'phone', locale: 'de-DE' });
      expect(input.value).toBe('+__ ___ ________');
    });

    it('should resolve "creditcard" preset (16-digit pattern)', () => {
      const { input, directive, fixture } = setup({ mask: 'creditcard' });
      typeSequence(input, '4111111111111111', directive, fixture);
      expect(directive.isComplete()).toBe(true);
      expect(input.value).toBe('4111 1111 1111 1111');
    });

    it('should resolve "ip" preset', () => {
      const { input } = setup({ mask: 'ip' });
      // IP mask uses optional digits (9) so guide shows placeholders
      expect(input.value).toContain('.');
    });

    it('should resolve "time" preset', () => {
      const { input, directive, fixture } = setup({ mask: 'time' });
      typeSequence(input, '1430', directive, fixture);
      expect(input.value).toBe('14:30');
      expect(directive.isComplete()).toBe(true);
    });

    it('should resolve "iban:CH" preset and accept letters + digits', () => {
      const { input, directive, fixture } = setup({ mask: 'iban:CH' });
      typeSequence(input, 'CH93', directive, fixture);
      expect(directive.rawValue()).toBe('CH93');
    });
  });

  // ── Multi-pattern ───────────────────────────────────────────────────

  describe('multi-pattern', () => {
    it('should select pattern based on input length', () => {
      const { input, directive, fixture } = setup({ mask: '(00) 0000-0000|(00) 00000-0000' });
      // Type 10 digits — should use first pattern (10 slots)
      typeSequence(input, '1198765432', directive, fixture);
      expect(input.value).toBe('(11) 9876-5432');
      expect(directive.isComplete()).toBe(true);
    });
  });

  // ── Public methods ──────────────────────────────────────────────────

  describe('setValue()', () => {
    it('should programmatically set the raw value', () => {
      const { directive, fixture, input } = setup();
      directive.setValue('1234567890');
      flush(fixture);
      expect(directive.rawValue()).toBe('1234567890');
      expect(input.value).toBe('(123) 456-7890');
    });

    it('should filter out invalid characters', () => {
      const { directive, fixture } = setup();
      directive.setValue('12abc34');
      flush(fixture);
      expect(directive.rawValue()).toBe('1234');
    });
  });

  describe('clear()', () => {
    it('should clear the mask value', () => {
      const { input, directive, fixture } = setup();
      typeSequence(input, '123', directive, fixture);
      expect(directive.rawValue()).toBe('123');
      directive.clear();
      flush(fixture);
      expect(directive.rawValue()).toBe('');
      expect(input.value).toBe('(___) ___-____');
    });
  });
});
