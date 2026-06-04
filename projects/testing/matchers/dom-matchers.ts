/**
 * Custom vitest matchers for DOM element assertions.
 *
 * Register in your test setup file:
 * ```typescript
 * import { cngxMatchers } from '@cngx/testing';
 * expect.extend(cngxMatchers);
 * ```
 */
export const cngxMatchers = {
  /** Asserts the element has the given CSS class. */
  toHaveClass(received: HTMLElement, className: string) {
    const pass = received.classList.contains(className);
    return {
      pass,
      message: () =>
        pass
          ? `Expected element NOT to have class "${className}", but it does.\nClasses: ${received.className}`
          : `Expected element to have class "${className}", but it doesn't.\nClasses: ${received.className}`,
    };
  },

  /** Asserts the element has the given attribute, optionally with a specific value. */
  toHaveAttribute(received: HTMLElement, name: string, value?: string) {
    const hasAttr = received.hasAttribute(name);
    if (value === undefined) {
      return {
        pass: hasAttr,
        message: () =>
          hasAttr
            ? `Expected element NOT to have attribute "${name}".`
            : `Expected element to have attribute "${name}".`,
      };
    }
    const actual = received.getAttribute(name);
    const pass = actual === value;
    return {
      pass,
      message: () =>
        pass
          ? `Expected attribute "${name}" NOT to be "${value}".`
          : `Expected attribute "${name}" to be "${value}", but got "${actual}".`,
    };
  },

  /** Asserts the element has a CSS custom property with the given value. */
  toHaveCSSVariable(received: HTMLElement, name: string, value: string) {
    const actual = received.style.getPropertyValue(name).trim();
    const pass = actual === value;
    return {
      pass,
      message: () =>
        pass
          ? `Expected CSS variable "${name}" NOT to be "${value}".`
          : `Expected CSS variable "${name}" to be "${value}", but got "${actual}".`,
    };
  },
};

/** Type augmentation for vitest's expect. */
declare module 'vitest' {
  interface Assertion<T> {
    toHaveClass(className: string): T;
    toHaveAttribute(name: string, value?: string): T;
    toHaveCSSVariable(name: string, value: string): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveClass(className: string): unknown;
    toHaveAttribute(name: string, value?: string): unknown;
    toHaveCSSVariable(name: string, value: string): unknown;
  }
}
