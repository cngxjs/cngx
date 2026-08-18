import { untrackedInEffect } from './untracked-in-effect';
import { createRuleTester } from '../testing/rule-tester';

createRuleTester().run('untracked-in-effect', untrackedInEffect, {
  valid: [
    {
      name: 'service call wrapped in untracked',
      code: `
        class C {
          c() {
            effect(() => {
              untracked(() => this.svc.load());
            });
          }
        }
      `,
    },
    {
      name: 'the documented CngxAsyncContainer exception',
      code: `
        class CngxAsyncContainer {
          c() {
            effect(() => {
              this.svc.load();
            });
          }
        }
      `,
    },
    {
      name: 'cngx-allow-effect-writes marker on the class',
      code: `
        // cngx-allow-effect-writes
        class C {
          sync = effect(() => {
            this.svc.load();
          });
        }
      `,
    },
    {
      name: 'single-level read of a declared signal field',
      code: `
        class C {
          count = signal(0);
          sync = effect(() => {
            this.count();
          });
        }
      `,
    },
    {
      name: 'read of a required input field',
      code: `
        class C {
          value = input.required();
          sync = effect(() => {
            this.value();
          });
        }
      `,
    },
    {
      name: 'non-this call is ignored',
      code: `
        class C {
          c() {
            effect(() => {
              console.log('tick');
            });
          }
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'raw service call in an effect',
      code: `
        class C {
          c() {
            effect(() => {
              this.svc.load();
            });
          }
        }
      `,
      errors: [{ messageId: 'unwrappedCallInEffect' }],
    },
    {
      name: 'single-level call to a non-signal member',
      code: `
        class C {
          c() {
            effect(() => {
              this.reload();
            });
          }
        }
      `,
      errors: [{ messageId: 'unwrappedCallInEffect' }],
    },
    {
      name: 'single-level call with arguments',
      code: `
        class C {
          c() {
            effect(() => {
              this.track('open');
            });
          }
        }
      `,
      errors: [{ messageId: 'unwrappedCallInEffect' }],
    },
  ],
});
