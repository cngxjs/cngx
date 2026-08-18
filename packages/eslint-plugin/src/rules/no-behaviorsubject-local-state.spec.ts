import { noBehaviorsubjectLocalState } from './no-behaviorsubject-local-state';
import { createRuleTester } from '../testing/rule-tester';

createRuleTester().run('no-behaviorsubject-local-state', noBehaviorsubjectLocalState, {
  valid: [
    {
      name: 'signal field on a component',
      code: `
        @Component({})
        class C {
          count = signal(0);
        }
      `,
    },
    {
      name: 'Subject on an injectable service is left alone',
      code: `
        @Injectable()
        class Store {
          events$ = new Subject();
        }
      `,
    },
    {
      name: 'Subject on a plain undecorated class is left alone',
      code: `
        class Bus {
          channel = new BehaviorSubject(false);
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'BehaviorSubject field on a component',
      code: `
        @Component({})
        class C {
          private open = new BehaviorSubject(false);
        }
      `,
      errors: [{ messageId: 'behaviorSubjectLocalState' }],
    },
    {
      name: 'Subject field on a directive',
      code: `
        @Directive({})
        class D {
          private ticks = new Subject();
        }
      `,
      errors: [{ messageId: 'behaviorSubjectLocalState' }],
    },
  ],
});
