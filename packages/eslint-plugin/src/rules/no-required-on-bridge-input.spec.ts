import { noRequiredOnBridgeInput } from './no-required-on-bridge-input';
import { createRuleTester } from '../testing/rule-tester';

createRuleTester().run('no-required-on-bridge-input', noRequiredOnBridgeInput, {
  valid: [
    {
      name: 'required input on a class with no fallback token',
      code: `
        class C {
          value = input.required();
        }
      `,
    },
    {
      name: 'bridge class keeping its input optional',
      code: `
        class C {
          private state = inject(CNGX_STATEFUL, { optional: true });
          value = input(undefined, { transform: (v) => v });
        }
      `,
    },
    {
      name: 'non-optional inject does not make it a bridge',
      code: `
        class C {
          private dep = inject(SomeToken);
          value = input.required();
        }
      `,
    },
    {
      name: 'an unrelated optional inject (config token) does not make it a bridge',
      code: `
        class C {
          private config = inject(CNGX_SELECT_CONFIG, { optional: true });
          value = input.required();
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'required input alongside a CNGX_STATEFUL fallback',
      code: `
        class C {
          private state = inject(CNGX_STATEFUL, { optional: true });
          value = input.required();
        }
      `,
      errors: [{ messageId: 'requiredOnBridgeInput' }],
    },
    {
      name: 'required input alongside a fallback token named via the tokens option',
      code: `
        class C {
          private dep = inject(MY_STATEFUL_BRIDGE, { optional: true });
          value = input.required();
        }
      `,
      options: [{ tokens: ['MY_STATEFUL_BRIDGE'] }],
      errors: [{ messageId: 'requiredOnBridgeInput' }],
    },
  ],
});
