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
import { CngxBadge, CngxDivider, CngxTag } from '@cngx/common/display';
import { CngxButtonToggle, CngxButtonToggleGroup, CngxRipple } from '@cngx/common/interactive';

import { injectLabSheet } from '../inject-lab-sheet';
import { LabPages } from '../lab-pages';

/**
 * Display pairs of the Material bridge fidelity harness: badge, button-toggle,
 * card, divider, tag and ripple. Material left (`probe-mat`), cngx right
 * (`probe-cngx`), both under the `material-lab-display-theme` bundle.
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
    CngxCard,
    CngxCardBody,
    CngxCardHeader,
    CngxCardSubtitle,
    CngxCardTitle,
    CngxDivider,
    CngxRipple,
    CngxTag,
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

      <section class="lab-wide" data-pair="tag">
        <h3>tag (Material chip left, cngx outline tag right)</h3>
        <div class="lab-row">
          <mat-chip-set aria-label="Material tags">
            <mat-chip class="probe-mat">Design</mat-chip>
          </mat-chip-set>
          <span class="probe-cngx" cngxTag variant="outline">Design</span>
        </div>
      </section>

      <section class="lab-wide" data-pair="ripple">
        <h3>ripple (Material left, cngx right; press to see the wave)</h3>
        <div class="lab-row">
          <div class="probe-mat lab-ripple-box" matRipple>Press</div>
          <div class="probe-cngx lab-ripple-box" cngxRipple>Press</div>
        </div>
      </section>
    </div>
  `,
})
export class LabDisplay {
  protected readonly matView = signal('list');
  protected readonly cngxView = signal<string | undefined>('list');

  constructor() {
    injectLabSheet('material-lab-display-theme');
  }
}
