import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'cngxMatTabs: a sticky-error commit lifecycle with toast + banner bridges',
  subtitle:
    'One <code>cngxMatTabs</code> attribute upgrades a vanilla <code>&lt;mat-tab-group&gt;</code> with the async commit lifecycle. <code>[commitAction]</code> runs an <code>Observable</code> between tab switches; <code>optimistic</code> advances then rolls back when the commit does not land, <code>pessimistic</code> holds on the origin. Either way the target tab is decorated (<code>.cngx-mat-tab--error</code> + an SR descriptor referenced through <code>aria-describedby</code>; <code>aria-invalid</code> is form-field vocabulary and stays off a tab button). A throw or an erroring observable is a failure: the commit state goes to <code>error</code> and the co-located <code>cngxToastOn</code> / <code>cngxBannerOn</code> bridges report it - both self-wire off <code>CNGX_STATEFUL</code>, no <code>inject()</code> in the consumer. Answering <code>false</code> is a refusal: the descriptor reads the refused phrase, <code>lastOutcome()</code> reads <code>refused</code>, the commit state goes back to <code>idle</code> and no bridge fires; the action shows its own warning toast and the visible reason below the group is driven by <code>lastOutcome()</code>. Per-tab <code>[cngxMatTabError]</code> badges read the forms’ <code>statusChanges</code>, and a second group shows the smart-overflow "More" affordance the directive mounts automatically.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'integration', 'composition', 'a11y-pattern'],
  apiComponents: ['CngxMatTabs', 'CngxMatTabError'],
  moduleImports: [
    "import { Observable } from 'rxjs';",
    "import { startWith } from 'rxjs/operators';",
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';",
    "import { MatTabsModule } from '@angular/material/tabs';",
    "import { injectErrorAggregator } from '@cngx/common/interactive';",
    "import { CngxTabGroupPresenter, type CngxTabsCommitAction } from '@cngx/common/tabs';",
    "import { CngxMatTabs, CngxMatTabError } from '@cngx/ui/mat-tabs';",
    "import { CngxToaster, CngxToastOn, CngxBannerOn } from '@cngx/ui/feedback';",
  ],
  imports: [
    'MatTabsModule',
    'ReactiveFormsModule',
    'CngxMatTabs',
    'CngxMatTabError',
    'CngxToastOn',
    'CngxBannerOn',
  ],
  setup: `private readonly toaster = inject(CngxToaster);
  protected readonly presenter = viewChild(CngxTabGroupPresenter);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly outcome = signal<'accept' | 'error' | 'refusal'>('accept');
  protected readonly refused = computed(() => {
    const presenter = this.presenter();
    return presenter?.lastFailedIndex() !== undefined && presenter?.lastOutcome()?.kind === 'refused';
  });

  // One async gate drives every tab switch. A failure errors the observable,
  // so the decoration and both feedback bridges fire off a single source.
  // A refusal answers false: the decoration still lands, the bridges stay
  // silent and the action toasts its own reason.
  protected readonly commitAction: CngxTabsCommitAction = (from, to) => {
    const outcome = this.outcome();
    return new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        if (outcome === 'error') {
          sub.error(new Error('Could not save tab ' + from + ' -> ' + to));
          return;
        }
        if (outcome === 'refusal') {
          this.toaster.show({ message: 'Fix the profile first.', severity: 'warning' });
          sub.next(false);
          sub.complete();
          return;
        }
        sub.next(true);
        sub.complete();
      }, 600);
      return () => clearTimeout(handle);
    });
  };

  // Two Reactive forms that START invalid, so the [cngxMatTabError] badge is
  // visible at load; typing a valid value clears it live through statusChanges.
  protected readonly profileForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });
  protected readonly accountForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  private readonly profileStatus = toSignal(
    this.profileForm.statusChanges.pipe(startWith(this.profileForm.status)),
    { initialValue: this.profileForm.status },
  );
  private readonly accountStatus = toSignal(
    this.accountForm.statusChanges.pipe(startWith(this.accountForm.status)),
    { initialValue: this.accountForm.status },
  );

  protected readonly profileErrors = injectErrorAggregator(
    undefined,
    { profile: computed(() => this.profileStatus() === 'INVALID') },
    undefined,
    { profile: 'Profile name is required (min 2 characters)' },
  );
  protected readonly accountErrors = injectErrorAggregator(
    undefined,
    { account: computed(() => this.accountStatus() === 'INVALID') },
    undefined,
    { account: 'Account email must be a valid address' },
  );

  // Ten tabs in a narrow container so the directive's auto-mounted
  // cngx-tab-overflow "More" affordance engages.
  protected readonly overflowTabs = Array.from({ length: 10 }, (_, i) => 'Section ' + (i + 1));`,
  template: `  <section aria-label="Commit lifecycle and error bridges">
    <mat-tab-group
      cngxMatTabs
      #mt="cngxMatTabs"
      [commitAction]="commitAction"
      [commitMode]="mode()"
      cngxToastOn
      [toastError]="'Tab transition failed'"
      [toastErrorDetail]="true"
      cngxBannerOn
      bannerId="mat-tabs:commit-error"
      [bannerError]="'The server could not switch the tab.'"
      aria-label="Account settings"
    >
      <mat-tab label="Profile" [cngxMatTabError]="profileErrors">
        <form
          [formGroup]="profileForm"
          style="display:flex;flex-direction:column;gap:6px;padding:12px"
        >
          <label style="display:flex;flex-direction:column;gap:4px">
            <span>Name</span>
            <input type="text" formControlName="name" />
          </label>
          <small style="opacity:0.7">Required, min 2 characters</small>
        </form>
      </mat-tab>

      <mat-tab label="Account" [cngxMatTabError]="accountErrors">
        <form
          [formGroup]="accountForm"
          style="display:flex;flex-direction:column;gap:6px;padding:12px"
        >
          <label style="display:flex;flex-direction:column;gap:4px">
            <span>Email</span>
            <input type="email" formControlName="email" />
          </label>
          <small style="opacity:0.7">Required, valid email address</small>
        </form>
      </mat-tab>

      <mat-tab label="Notifications">
        <p style="padding:12px">No aggregator bound - this tab never gains the error badge.</p>
      </mat-tab>
    </mat-tab-group>
    @if (refused()) {
      <p>Not allowed yet: fix the profile first.</p>
    }
  </section>

  <section aria-label="Smart overflow" style="max-width:600px;margin-top:24px">
    <mat-tab-group cngxMatTabs aria-label="Workspace sections">
      @for (label of overflowTabs; track label) {
        <mat-tab [label]="label">
          <p style="padding:12px">{{ label }} content.</p>
        </mat-tab>
      }
    </mat-tab-group>
  </section>`,
  templateChromeBefore: `<p style="margin-bottom:12px">
    Toggle the commit mode and pick an outcome, then click a tab. A failure decorates the target
    tab, fires a toast and a banner, and Material rolls the selection back. A refusal decorates the
    tab and rolls back too, but only the action's own warning toast appears.
  </p>`,
  templateChrome: `<div class="event-grid" style="margin-top:16px;gap:8px">
    <div class="event-row" style="gap:8px">
      <span class="event-label">Commit mode</span>
      <span class="event-value" style="display:flex;gap:6px">
        <button
          type="button"
          (click)="mode.set('optimistic')"
          [attr.aria-pressed]="mode() === 'optimistic'"
        >optimistic</button>
        <button
          type="button"
          (click)="mode.set('pessimistic')"
          [attr.aria-pressed]="mode() === 'pessimistic'"
        >pessimistic</button>
      </span>
    </div>
    <div class="event-row" style="gap:8px">
      <span class="event-label">Outcome</span>
      <span class="event-value" role="radiogroup" aria-label="Commit outcome" style="display:flex;gap:12px">
        <label style="display:inline-flex;align-items:center;gap:4px">
          <input type="radio" name="cngx-mat-tabs-commit-outcome"
                 [checked]="outcome() === 'accept'"
                 (change)="outcome.set('accept')" />
          accept
        </label>
        <label style="display:inline-flex;align-items:center;gap:4px">
          <input type="radio" name="cngx-mat-tabs-commit-outcome"
                 [checked]="outcome() === 'error'"
                 (change)="outcome.set('error')" />
          simulate error
        </label>
        <label style="display:inline-flex;align-items:center;gap:4px">
          <input type="radio" name="cngx-mat-tabs-commit-outcome"
                 [checked]="outcome() === 'refusal'"
                 (change)="outcome.set('refusal')" />
          simulate refusal
        </label>
      </span>
    </div>
    <div class="event-row" style="gap:8px">
      <span class="event-value">
        <button type="button" (click)="mt.clearLastFailed()">Clear last failed</button>
      </span>
    </div>
    <div class="event-row">
      <span class="event-label">State</span>
      <span class="event-value">mode {{ mode() }} / outcome {{ outcome() }}</span>
    </div>
  </div>`,
};
