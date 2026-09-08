import { describe, expect, it } from 'vitest';
import { cngxMatchers } from '@cngx/testing';

// Characterization of the shared @cngx/testing DOM matchers, co-located with
// the display atoms whose specs are their natural consumers (projects/testing
// has no test runner). Deliberately NO local expect.extend call: the matchers
// must already be live via the shared vitest-setup wired into every test
// target - that registration is the contract under test.
describe('cngxMatchers (registered by vitest-setup)', () => {
  function element(): HTMLElement {
    return document.createElement('div');
  }

  describe('toHaveClass', () => {
    it('passes when the class is present and supports .not', () => {
      const el = element();
      el.classList.add('active');

      expect(el).toHaveClass('active');
      expect(el).not.toHaveClass('disabled');
    });

    it('fails with the class list in the message', () => {
      const el = element();
      el.classList.add('idle');

      expect(() => expect(el).toHaveClass('active')).toThrowError(
        /Expected element to have class "active".*idle/s,
      );
    });
  });

  describe('toHaveAttribute', () => {
    it('asserts presence without a value and supports .not', () => {
      const el = element();
      el.setAttribute('aria-busy', 'true');

      expect(el).toHaveAttribute('aria-busy');
      expect(el).not.toHaveAttribute('aria-hidden');
    });

    it('asserts an exact value', () => {
      const el = element();
      el.setAttribute('aria-busy', 'true');

      expect(el).toHaveAttribute('aria-busy', 'true');
    });

    it('fails with the actual value in the message', () => {
      const el = element();
      el.setAttribute('aria-busy', 'false');

      expect(() => expect(el).toHaveAttribute('aria-busy', 'true')).toThrowError(
        /Expected attribute "aria-busy" to be "true", but got "false"/,
      );
    });
  });

  describe('toHaveCSSVariable', () => {
    it('asserts the declared inline-style value and supports .not', () => {
      const el = element();
      el.style.setProperty('--cngx-gap-md', '16px');

      expect(el).toHaveCSSVariable('--cngx-gap-md', '16px');
      expect(el).not.toHaveCSSVariable('--cngx-gap-md', '8px');
    });

    it('fails with the actual declared value in the message', () => {
      const el = element();
      el.style.setProperty('--cngx-gap-md', '12px');

      expect(() => expect(el).toHaveCSSVariable('--cngx-gap-md', '16px')).toThrowError(
        /Expected CSS variable "--cngx-gap-md" to be "16px", but got "12px"/,
      );
    });
  });

  it('exports the matcher set the setup registers', () => {
    expect(Object.keys(cngxMatchers).sort()).toEqual([
      'toHaveAttribute',
      'toHaveCSSVariable',
      'toHaveClass',
    ]);
  });
});
