import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';

import {
  CngxCard,
  CngxCardBody,
  CngxCardHeader,
  CngxCardSubtitle,
  CngxCardTitle,
} from '@cngx/common/card';
import {
  CngxAvatar,
  CngxBadge,
  CngxChip,
  CngxDivider,
  CngxPasswordStrengthMeter,
  CngxSegmentedProgress,
  CngxStatus,
} from '@cngx/common/display';
import {
  CngxAsyncClick,
  CngxButtonToggle,
  CngxButtonToggleGroup,
  CngxCopyBlock,
  CngxRipple,
  CngxSpeak,
} from '@cngx/common/interactive';
import { CngxFileDrop, CngxRating } from '@cngx/forms/input';
import { CngxEmptyState } from '@cngx/ui/empty-state';
import { CngxSkeletonContainer, CngxSkeletonPlaceholder } from '@cngx/ui/skeleton';
import { CngxSpeakButton } from '@cngx/ui/speak';

import { injectLabSheet } from '../inject-lab-sheet';
import { LabPages } from '../lab-pages';

/**
 * Display pairs of the Material bridge fidelity harness: badge, button-toggle,
 * card, chip, divider and ripple. Material left (`probe-mat`), cngx right
 * (`probe-cngx`), both under the `material-lab-display-theme` bundle.
 *
 * Below the pairs sit the cngx-only display widgets, each under its bridge.
 * Material has no twin for them, so they are here for the eye; their token
 * reach is pinned in `e2e/material-bridge-rendered.spec.ts`.
 *
 * Route: `/#/material-lab/display`.
 */
@Component({
  selector: 'app-lab-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    LabPages,
    MatBadgeModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatRippleModule,
    CngxBadge,
    CngxButtonToggle,
    CngxButtonToggleGroup,
    CngxAsyncClick,
    CngxAvatar,
    CngxCard,
    CngxCardBody,
    CngxCardHeader,
    CngxCardSubtitle,
    CngxCardTitle,
    CngxChip,
    CngxCopyBlock,
    CngxDivider,
    CngxEmptyState,
    CngxFileDrop,
    CngxPasswordStrengthMeter,
    CngxRating,
    CngxRipple,
    CngxSegmentedProgress,
    CngxSkeletonContainer,
    CngxSkeletonPlaceholder,
    CngxSpeak,
    CngxSpeakButton,
    CngxStatus,
  ],
  template: `
    <div class="lab mat-app-background mat-typography">
      <nav appLabPages></nav>

      <section class="lab-wide" data-pair="badge">
        <h3>badge (Material left, cngx right)</h3>
        <div class="lab-row lab-badge-row">
          <span class="probe-mat" matBadge="4" aria-hidden="true">Inbox</span>
          <span class="probe-cngx" [cngxBadge]="4" color="error" aria-hidden="true">Inbox</span>
        </div>
      </section>

      <section class="lab-wide" data-pair="button-toggle">
        <h3>button-toggle (Material left, cngx right)</h3>
        <div class="lab-row">
          <mat-button-toggle-group class="probe-mat" aria-label="Material layout" [value]="matView()" (change)="matView.set($event.value)">
            <mat-button-toggle value="grid">Grid</mat-button-toggle>
            <mat-button-toggle value="list">List</mat-button-toggle>
            <mat-button-toggle value="table">Table</mat-button-toggle>
          </mat-button-toggle-group>
          <cngx-button-toggle-group class="probe-cngx" label="cngx layout" [(value)]="cngxView">
            <button type="button" cngxButtonToggle value="grid">Grid</button>
            <button type="button" cngxButtonToggle value="list">List</button>
            <button type="button" cngxButtonToggle value="table">Table</button>
          </cngx-button-toggle-group>
        </div>
      </section>

      <section class="lab-wide" data-pair="card">
        <h3>card (Material raised and outlined left, cngx right)</h3>
        <div class="lab-pair">
          <mat-card class="probe-mat lab-card">
            <mat-card-header>
              <mat-card-title>Quarterly report</mat-card-title>
              <mat-card-subtitle>Finance</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>Revenue grew in every region.</mat-card-content>
          </mat-card>
          <mat-card class="probe-mat-outlined lab-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title>Quarterly report</mat-card-title>
              <mat-card-subtitle>Finance</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>Revenue grew in every region.</mat-card-content>
          </mat-card>
          <cngx-card class="probe-cngx lab-card">
            <header cngxCardHeader>
              <h4 cngxCardTitle>Quarterly report</h4>
              <span cngxCardSubtitle>Finance</span>
            </header>
            <div cngxCardBody>Revenue grew in every region.</div>
          </cngx-card>
        </div>
      </section>

      <section data-pair="divider">
        <h3>divider (Material top, cngx bottom)</h3>
        <mat-divider class="probe-mat" />
        <cngx-divider class="probe-cngx" />
      </section>

      <section class="lab-wide" data-pair="chip">
        <h3>chip (Material left, cngx right)</h3>
        <div class="lab-row">
          <mat-chip-set aria-label="Material chips">
            <mat-chip class="probe-mat">Design</mat-chip>
          </mat-chip-set>
          <cngx-chip class="probe-cngx">Design</cngx-chip>
        </div>
      </section>

      <section class="lab-wide" data-pair="ripple">
        <h3>ripple (Material left, cngx right; press to see the wave)</h3>
        <div class="lab-row">
          <div class="probe-mat lab-ripple-box" matRipple>Press</div>
          <div class="probe-cngx lab-ripple-box" cngxRipple>Press</div>
        </div>
      </section>

      <h2 class="lab-heading">cngx-only (no Material twin)</h2>

      <section class="lab-wide" data-pendant="avatar">
        <h3>avatar</h3>
        <div class="lab-pendant">
          <cngx-avatar initials="AL" status="online" />
          <cngx-avatar initials="BK" status="busy" />
          <cngx-avatar initials="CM" status="away" shape="square" />
          <cngx-avatar initials="DN" status="offline" size="lg" />
        </div>
      </section>

      <section class="lab-wide" data-pendant="status">
        <h3>status</h3>
        <div class="lab-pendant">
          <cngx-status tone="success" label="Operational" />
          <cngx-status tone="warning" label="Degraded" />
          <cngx-status tone="danger" label="Outage" />
          <cngx-status tone="info" label="Maintenance" />
          <cngx-status tone="neutral" label="Unknown" />
        </div>
      </section>

      <section class="lab-wide" data-pendant="segmented-progress">
        <h3>segmented-progress</h3>
        <cngx-segmented-progress class="lab-meter" [segments]="segments" />
      </section>

      <section class="lab-wide" data-pendant="password-strength-meter">
        <h3>password-strength-meter (weak, good)</h3>
        <div class="lab-pendant">
          <cngx-password-strength-meter class="lab-meter" [score]="1" />
          <cngx-password-strength-meter class="lab-meter" [score]="3" />
        </div>
      </section>

      <section class="lab-wide" data-pendant="skeleton">
        <h3>skeleton</h3>
        <cngx-skeleton [loading]="true" [showDelay]="0">
          <ng-template cngxSkeletonPlaceholder>
            <div class="cngx-skeleton__bone lab-bone"></div>
          </ng-template>
        </cngx-skeleton>
      </section>

      <section class="lab-wide" data-pendant="empty-state">
        <h3>empty-state</h3>
        <cngx-empty-state title="No results" description="Try a different filter." />
      </section>

      <section class="lab-wide" data-pendant="copy-block">
        <h3>copy-block</h3>
        <cngx-copy-block value="npm install @cngx/themes">
          <code>npm install &#64;cngx/themes</code>
        </cngx-copy-block>
      </section>

      <section class="lab-wide" data-pendant="async-click">
        <h3>async-click (press for success or error)</h3>
        <div class="lab-pendant">
          <button type="button" class="lab-async" [cngxAsyncClick]="succeed">Save</button>
          <button type="button" class="lab-async" [cngxAsyncClick]="fail">Fail</button>
        </div>
      </section>

      <section class="lab-wide" data-pendant="speak-button">
        <h3>speak-button</h3>
        <div class="lab-pendant">
          <span [cngxSpeak]="speakText" #tts="cngxSpeak">{{ speakText }}</span>
          <cngx-speak-button [speakRef]="tts" />
        </div>
      </section>

      <section class="lab-wide" data-pendant="rating">
        <h3>rating</h3>
        <cngx-rating ariaLabel="Lab rating" [value]="3" />
      </section>

      <section class="lab-wide" data-pendant="file-drop">
        <h3>file-drop (drag a file over it)</h3>
        <div cngxFileDrop ariaLabel="Drop files">Drop files here</div>
      </section>
    </div>
  `,
})
export class LabDisplay {
  protected readonly matView = signal('list');
  protected readonly cngxView = signal<string | undefined>('list');
  protected readonly segments = ['done', 'done', 'active', 'todo', 'error'] as const;
  protected readonly speakText = 'Read this line aloud.';
  protected readonly succeed = (): Promise<void> => Promise.resolve();
  protected readonly fail = (): Promise<void> => Promise.reject(new Error('lab failure'));

  constructor() {
    injectLabSheet('material-lab-display-theme');
  }
}
