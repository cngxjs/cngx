import { modelForTwoWay } from './model-for-two-way';
import { createRuleTester } from '../testing/rule-tester';

createRuleTester().run('model-for-two-way', modelForTwoWay, {
  valid: [
    {
      name: 'a single model()',
      code: `
        class C {
          value = model(0);
        }
      `,
    },
    {
      name: 'input without a matching Change output',
      code: `
        class C {
          value = input(0);
        }
      `,
    },
    {
      name: 'output without a matching input',
      code: `
        class C {
          valueChange = output();
        }
      `,
    },
    {
      name: 'input and an unrelated output',
      code: `
        class C {
          value = input(0);
          openedChange = output();
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'input plus matching Change output',
      code: `
        class C {
          value = input(0);
          valueChange = output();
        }
      `,
      errors: [{ messageId: 'useModelForTwoWay' }],
    },
    {
      name: 'required input plus matching Change output',
      code: `
        class C {
          value = input.required();
          valueChange = output();
        }
      `,
      errors: [{ messageId: 'useModelForTwoWay' }],
    },
  ],
});
