import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Mat-tabs — instrumentation directive',
  navLabel: 'Instrumentation',
  navCategory: 'mat-tabs',
  description:
    'Add <code>cngxMatTabs</code> to an existing <code>&lt;mat-tab-group&gt;</code> and the cngx commit-action lifecycle, the <code>CNGX_STATEFUL</code> producer, and the bridge directive composition (<code>&lt;cngx-toast-on /&gt;</code>, <code>&lt;cngx-banner-on /&gt;</code>) light up — without rewriting your template. One attribute upgrade. Identical commit semantics to <code>&lt;cngx-tab-group&gt;</code>: <code>[commitMode]="optimistic"</code> (default) advances Material immediately and rolls back on rejection; <code>[commitMode]="pessimistic"</code> keeps Material on the origin until the action resolves. Rapid consecutive picks supersede any in-flight commit. <strong>Sticky error UX:</strong> when the commit-action rejects, the failed-target <code>&lt;mat-tab&gt;</code> button keeps a red <code>cngx-mat-tab--error</code> class + <code>aria-invalid="true"</code> until the user successfully re-picks it OR clicks the "Clear last failed" button. <strong>Per-tab form-error aggregation:</strong> bind <code>[cngxMatTabError]</code> on a <code>&lt;mat-tab&gt;</code> with a <code>CngxErrorAggregator</code> and the matching tab gains a <code>cngx-mat-tab--has-errors</code> badge + an SR descriptor span — fully independent of the commit-action rejection lifecycle, so a tab can carry both signals at once. The CSS skin (<code>@cngx/ui/mat-tabs/styles/mat-tabs.css</code>) is a standalone stylesheet asset; the dev-app imports it once in <code>styles.css</code>.',
  apiComponents: ['CngxMatTabs', 'CngxMatTabError', 'CngxToastOn', 'CngxBannerOn'],
  moduleImports: [
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';",
    "import { Observable } from 'rxjs';",
    "import { startWith } from 'rxjs/operators';",
    "import { MatTabsModule } from '@angular/material/tabs';",
    "import { type CngxTabsCommitAction } from '@cngx/common/tabs';",
    "import { injectErrorAggregator } from '@cngx/common/interactive';",
    "import { CngxMatTabs, CngxMatTabError } from '@cngx/ui/mat-tabs';",
    "import { CngxBanner, CngxToaster, CngxToastOn, CngxBannerOn } from '@cngx/ui/feedback';",
  ],
  setup: `
  private readonly toaster = inject(CngxToaster);
  private readonly banner = inject(CngxBanner);

  protected readonly active = signal(0);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly shouldFail = signal(false);
  protected readonly latencyMs = signal(600);

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
  protected readonly profileInvalid = computed(
    () => this.profileStatus() === 'INVALID',
  );
  protected readonly accountInvalid = computed(
    () => this.accountStatus() === 'INVALID',
  );

  protected readonly profileErrors = injectErrorAggregator(
    undefined,
    { profile: this.profileInvalid },
    undefined,
    { profile: 'Profile name is required (min 2 chars)' },
  );
  protected readonly accountErrors = injectErrorAggregator(
    undefined,
    { account: this.accountInvalid },
    undefined,
    { account: 'Account email must be valid' },
  );

  protected clearAllFailureFeedback(matTabs: CngxMatTabs): void {
    matTabs.clearLastFailed();
    this.toaster.dismissAll();
    this.banner.dismiss('mat-tabs:commit-error');
  }

  protected readonly commitAction: CngxTabsCommitAction = (from, to) => {
    const ms = this.latencyMs();
    const fail = this.shouldFail();
    return new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        if (fail) {
          sub.error(new Error('Server refused tab ' + from + ' → ' + to));
        } else {
          sub.next(true);
          sub.complete();
        }
      }, ms);
      return () => clearTimeout(handle);
    });
  };
  `,
  sections: [
    {
      title: 'Vanilla <mat-tab-group> upgraded by adding cngxMatTabs',
      subtitle:
        'The <code>&lt;mat-tab-group&gt;</code> stays unchanged — <code>cngxMatTabs</code> is the only addition. The commit lifecycle, the <code>CNGX_STATEFUL</code> producer, and the toast + banner bridges work identically to <code>&lt;cngx-tab-group&gt;</code>. The Profile and Account tabs each bind <code>[cngxMatTabError]</code> to a per-tab <code>CngxErrorAggregator</code> whose source reads the form\'s <code>statusChanges</code> — type into the form to see the badge appear / disappear in real time. Toggle the simulate-error checkbox and pick a tab to see the orthogonal rejection signal land alongside.',
      imports: [
        'MatTabsModule',
        'ReactiveFormsModule',
        'CngxMatTabs',
        'CngxMatTabError',
        'CngxToastOn',
        'CngxBannerOn',
      ],
      template: `
  <div class="event-row" style="gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
    <button type="button" class="chip"
            [style.background]="mode() === 'optimistic' ? '#c8e6c9' : ''"
            (click)="mode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [style.background]="mode() === 'pessimistic' ? '#c8e6c9' : ''"
            (click)="mode.set('pessimistic')">pessimistic</button>
    <label style="margin-inline-start:12px">
      <input type="checkbox"
             [checked]="shouldFail()"
             (change)="shouldFail.set($any($event.target).checked)" />
      simulate error
    </label>
    <label style="margin-inline-start:12px">
      latency
      <input type="range" min="100" max="2000" step="100"
             [value]="latencyMs()"
             (input)="latencyMs.set(+$any($event.target).value)" />
      {{ latencyMs() }}ms
    </label>
    <button type="button" class="chip"
            style="margin-inline-start:auto"
            title="presenter.clearLastFailed() + toaster.dismissAll() + banner.dismiss(...) — clears all three failure-feedback channels at once"
            (click)="clearAllFailureFeedback(mt)">
      Clear last failed
    </button>
  </div>
  <mat-tab-group
    #mt="cngxMatTabs"
    cngxMatTabs
    [(activeIndex)]="active"
    [commitAction]="commitAction"
    [commitMode]="mode()"
    cngxToastOn
    [toastError]="'Tab transition failed'"
    cngxBannerOn
    bannerId="mat-tabs:commit-error"
    [bannerError]="'Tab transition refused by the server.'"
    aria-label="Async tab navigation"
  >
    <mat-tab label="Profile" [cngxMatTabError]="profileErrors">
      <form [formGroup]="profileForm" style="display:flex;flex-direction:column;gap:8px;padding:12px">
        <label style="display:flex;flex-direction:column;gap:4px">
          <span>Name</span>
          <input type="text" formControlName="name" placeholder="Enter your name" />
        </label>
        <small style="opacity:0.7">Required, min 2 characters</small>
      </form>
    </mat-tab>
    <mat-tab label="Account" [cngxMatTabError]="accountErrors">
      <form [formGroup]="accountForm" style="display:flex;flex-direction:column;gap:8px;padding:12px">
        <label style="display:flex;flex-direction:column;gap:4px">
          <span>Email</span>
          <input type="email" formControlName="email" placeholder="you@example.com" />
        </label>
        <small style="opacity:0.7">Required, valid email format</small>
      </form>
    </mat-tab>
    <mat-tab label="Notifications">
      <p style="padding:12px">Notification preferences.</p>
    </mat-tab>
  </mat-tab-group>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Profile invalid</span><span class="event-value">{{ profileInvalid() }}</span></div>
    <div class="event-row"><span class="event-label">Account invalid</span><span class="event-value">{{ accountInvalid() }}</span></div>
  </div>`,
    },
  ],
};
