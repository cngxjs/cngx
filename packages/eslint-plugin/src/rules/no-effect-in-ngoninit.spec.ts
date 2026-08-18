import { noEffectInNgOnInit } from './no-effect-in-ngoninit';
import { createRuleTester } from '../testing/rule-tester';

createRuleTester().run('no-effect-in-ngoninit', noEffectInNgOnInit, {
  valid: [
    {
      name: 'effect in the constructor',
      code: `
        class C {
          constructor() {
            effect(() => this.log());
          }
        }
      `,
    },
    {
      name: 'effect as a field initializer',
      code: `
        class C {
          private readonly sync = effect(() => this.log());
        }
      `,
    },
    {
      name: 'ngOnInit without an effect',
      code: `
        class C {
          ngOnInit() {
            this.load();
          }
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'effect inside an ngOnInit method',
      code: `
        class C {
          ngOnInit() {
            effect(() => this.log());
          }
        }
      `,
      errors: [{ messageId: 'effectInNgOnInit' }],
    },
    {
      name: 'effect inside an arrow-field ngOnInit',
      code: `
        class C {
          ngOnInit = () => {
            effect(() => this.log());
          };
        }
      `,
      errors: [{ messageId: 'effectInNgOnInit' }],
    },
  ],
});
