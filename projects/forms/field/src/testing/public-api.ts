/**
 * Public surface of the field testing helpers. Consumed by
 * `@cngx/forms/field/testing` path alias — sibling libraries drop raw
 * relative imports like `'../../../../field/src/testing/mock-field'`
 * in favour of `import { createMockField } from '@cngx/forms/field/testing'`.
 *
 * Not published (testing code). Path alias only.
 */
export {
  createMockField,
  mockValidationError,
  type MockFieldOptions,
  type MockFieldRef,
} from './mock-field';
