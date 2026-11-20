import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { type CngxCommandGroup } from '@cngx/common/command';
import { createManualState } from '@cngx/common/data';
import { CngxIcon } from '@cngx/common/display';
import {
  CngxNavGroup,
  CngxNavGroupContent,
  CngxNavIcon,
  CngxNavLink,
} from '@cngx/common/interactive';
import { CngxBackdrop } from '@cngx/common/layout';
import {
  CngxPopover,
  CngxPopoverSheet,
  CngxPopoverSheetHandle,
  CngxPopoverSheetHeader,
  CngxPopoverSheetTitle,
  CngxPopoverTrigger,
  CngxTooltip,
} from '@cngx/common/popover';
import { CngxCommandPalette, CngxCommandPaletteTrigger } from '@cngx/ui/command-palette';
import {
  CngxContextMenu,
  CngxContextMenuDivider,
  CngxContextMenuFor,
  CngxContextMenuItem,
} from '@cngx/ui/context-menu';
import { CngxNavRail } from '@cngx/ui/nav-rail';
import { CngxToc } from '@cngx/ui/toc';

import { injectLabSheet } from '../inject-lab-sheet';
import { LabPages } from '../lab-pages';

/**
 * Overlay and navigation pairs of the Material bridge fidelity harness:
 * tooltip, context-menu, popover-sheet and nav-link. Material left
 * (`probe-mat`), cngx right (`probe-cngx`), both under the
 * `material-lab-overlay-nav-theme` bundle. Every overlay has its own opener
 * on both sides, so the pair is compared in its open state.
 *
 * Below the pairs sit the cngx-only pendants: backdrop, command-palette, toc
 * and the nav rail under its full `theme()`. Material has no twin for them,
 * so they are here for the eye; their token reach is pinned in
 * `e2e/material-bridge-rendered.spec.ts`.
 *
 * Route: `/#/material-lab/overlay-nav`.
 */
@Component({
  selector: 'app-lab-overlay-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    LabPages,
    MatBottomSheetModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
    CngxBackdrop,
    CngxCommandPalette,
    CngxCommandPaletteTrigger,
    CngxContextMenu,
    CngxContextMenuDivider,
    CngxContextMenuFor,
    CngxContextMenuItem,
    CngxIcon,
    CngxNavGroup,
    CngxNavGroupContent,
    CngxNavIcon,
    CngxNavLink,
    CngxNavRail,
    CngxPopover,
    CngxPopoverSheet,
    CngxPopoverSheetHandle,
    CngxPopoverSheetHeader,
    CngxPopoverSheetTitle,
    CngxPopoverTrigger,
    CngxToc,
    CngxTooltip,
  ],
  template: `
    <div class="lab mat-app-background mat-typography">
      <nav appLabPages></nav>

      <section class="lab-wide" data-pair="tooltip">
        <h3>tooltip (Material left, cngx right; hover or focus)</h3>
        <div class="lab-row">
          <button
            type="button"
            class="probe-mat-trigger lab-trigger"
            matTooltip="Archive the thread"
          >
            Material tooltip
          </button>
          <button
            type="button"
            class="probe-cngx-trigger lab-trigger"
            cngxTooltip="Archive the thread"
          >
            cngx tooltip
          </button>
        </div>
      </section>

      <section class="lab-wide" data-pair="context-menu">
        <h3>context-menu (Material left, cngx right; right-click or Shift+F10)</h3>
        <div class="lab-row">
          <div class="probe-mat-trigger lab-zone" tabindex="0" [matContextMenuTriggerFor]="matCtx">
            Material zone
          </div>
          <div class="probe-cngx-trigger lab-zone" tabindex="0" [cngxContextMenuFor]="cngxCtx">
            cngx zone
          </div>
        </div>
        <mat-menu #matCtx="matMenu" class="probe-mat">
          <button mat-menu-item>Copy</button>
          <button mat-menu-item>Cut</button>
          <button mat-menu-item>Paste</button>
        </mat-menu>
        <cngx-context-menu
          class="probe-cngx"
          ariaLabel="Clipboard actions"
          #cngxCtx="cngxContextMenu"
        >
          <cngx-context-menu-item value="copy" (select)="cngxCtx.popover.hide()"
            >Copy</cngx-context-menu-item
          >
          <cngx-context-menu-item value="cut" (select)="cngxCtx.popover.hide()"
            >Cut</cngx-context-menu-item
          >
          <cngx-context-menu-divider />
          <cngx-context-menu-item value="paste" (select)="cngxCtx.popover.hide()"
            >Paste</cngx-context-menu-item
          >
        </cngx-context-menu>
      </section>

      <section class="lab-wide" data-pair="popover-sheet">
        <h3>popover-sheet (MatBottomSheet left, cngx right)</h3>
        <div class="lab-row">
          <button type="button" class="probe-mat-trigger lab-trigger" (click)="openMatSheet()">
            Open Material sheet
          </button>
          <button
            type="button"
            class="probe-cngx-trigger lab-trigger"
            [cngxPopoverTrigger]="pop"
            (click)="pop.show()"
          >
            Open cngx sheet
          </button>
        </div>
        <ng-template #matSheetTpl>
          <div class="lab-sheet-body">
            <h4 class="lab-sheet-title">Share</h4>
            <p class="lab-sheet-text">Send the report to the team.</p>
          </div>
        </ng-template>
        <div
          cngxPopover
          #pop="cngxPopover"
          class="probe-cngx"
          [cngxPopoverSheet]="'sheet'"
          #sheet="cngxPopoverSheet"
        >
          <header cngxPopoverSheetHeader>
            <span cngxPopoverSheetHandle></span>
            <h4 cngxPopoverSheetTitle class="lab-sheet-title">Share</h4>
          </header>
          <div class="lab-sheet-body">
            <p class="lab-sheet-text">Send the report to the team.</p>
            <button type="button" class="lab-trigger" (click)="pop.hide()">Close</button>
          </div>
        </div>
      </section>

      <section class="lab-wide" data-pair="nav-link">
        <h3>nav-link (mat-nav-list left, cngxNavLink right)</h3>
        <div class="lab-row lab-nav-row">
          <mat-nav-list class="probe-mat lab-nav-list" aria-label="Material nav">
            @for (dest of destinations; track dest.id) {
              <a
                mat-list-item
                href="#nav"
                [activated]="dest.id === 'inbox'"
                (click)="$event.preventDefault()"
              >
                <mat-icon matListItemIcon>{{ dest.icon }}</mat-icon>
                <span matListItemTitle>{{ dest.label }}</span>
              </a>
            }
          </mat-nav-list>
          <nav class="probe-cngx lab-nav-list" aria-label="cngx nav">
            @for (dest of destinations; track dest.id) {
              <a
                cngxNavLink
                href="#nav"
                [active]="dest.id === 'inbox'"
                (click)="$event.preventDefault()"
              >
                <cngx-icon cngxNavIcon
                  ><mat-icon>{{ dest.icon }}</mat-icon></cngx-icon
                >{{ dest.label }}
              </a>
            }
          </nav>
        </div>
      </section>

      <h2 class="lab-heading">cngx-only (no Material twin)</h2>

      <section class="lab-wide" data-pendant="backdrop">
        <h3>backdrop (press to show, click the scrim to hide)</h3>
        <div class="lab-backdrop-frame">
          <div
            class="cngx-backdrop lab-backdrop"
            [cngxBackdrop]="backdropVisible()"
            (backdropClick)="backdropVisible.set(false)"
          ></div>
          <button type="button" class="lab-trigger" (click)="backdropVisible.set(true)">
            Show backdrop
          </button>
        </div>
      </section>

      <section class="lab-wide" data-pendant="command-palette">
        <h3>command-palette</h3>
        <button type="button" class="lab-trigger" [cngxCommandPaletteTrigger]="palette">
          Open palette
        </button>
        <cngx-command-palette #palette ariaLabel="Lab command palette" [results]="commands" />
      </section>

      <section class="lab-wide" data-pendant="toc">
        <h3>toc (scroll the article)</h3>
        <div class="lab-row lab-toc-row">
          <cngx-toc autoDiscover contentRoot=".lab-toc-article" headingSelector="h4" />
          <div class="lab-toc-article">
            <h4 id="lab-toc-overview">Overview</h4>
            <p>The rail lists these headings.</p>
            <h4 id="lab-toc-install">Installation</h4>
            <p>Pick a package manager.</p>
            <h4 id="lab-toc-usage">Usage</h4>
            <p>Drop the component into a template.</p>
          </div>
        </div>
      </section>

      <section class="lab-wide" data-pendant="nav-rail">
        <h3>nav-rail, full theme() (labels below and beside; More opens the flyout)</h3>
        <div class="lab-row lab-rail-row">
          @for (placement of railPlacements; track placement) {
            <cngx-nav-rail
              class="lab-nav-rail"
              [labelPlacement]="placement"
              [ariaLabel]="'cngx nav rail ' + placement"
            >
              @for (dest of destinations; track dest.id) {
                <a
                  cngxNavLink
                  href="#nav"
                  [active]="dest.id === 'inbox'"
                  (click)="$event.preventDefault()"
                >
                  <cngx-icon cngxNavIcon
                    ><mat-icon>{{ dest.icon }}</mat-icon></cngx-icon
                  >{{ dest.label }}
                </a>
              }
              <button type="button" cngxNavGroup #more="cngxNavGroup">
                <cngx-icon cngxNavIcon><mat-icon>more_horiz</mat-icon></cngx-icon
                >More
              </button>
              <div [cngxNavGroupContent]="more">
                <div>
                  @for (sub of moreLinks; track sub) {
                    <a cngxNavLink href="#nav" [depth]="1" (click)="$event.preventDefault()">{{
                      sub
                    }}</a>
                  }
                </div>
              </div>
            </cngx-nav-rail>
          }
        </div>
      </section>
    </div>
  `,
})
export class LabOverlayNav {
  private readonly matBottomSheet = inject(MatBottomSheet);
  private readonly matSheetTpl = viewChild.required<TemplateRef<unknown>>('matSheetTpl');

  protected readonly destinations = [
    { id: 'inbox', icon: 'inbox', label: 'Inbox' },
    { id: 'starred', icon: 'star', label: 'Starred' },
    { id: 'sent', icon: 'send', label: 'Sent' },
  ] as const;
  protected readonly railPlacements = ['below', 'end'] as const;
  protected readonly moreLinks = ['History', 'Downloads', 'Settings'] as const;
  protected readonly backdropVisible = signal(false);
  protected readonly commands = createManualState<CngxCommandGroup[]>();

  constructor() {
    injectLabSheet('material-lab-overlay-nav-theme');
    this.commands.setSuccess([
      {
        id: 'appearance',
        label: 'Appearance',
        commands: [
          { id: 'density', label: 'Compact density', run: () => undefined },
          { id: 'theme', label: 'Dark theme', run: () => undefined },
        ],
      },
      {
        id: 'navigation',
        label: 'Navigation',
        commands: [{ id: 'top', label: 'Scroll to top', run: () => undefined }],
      },
    ]);
  }

  protected openMatSheet(): void {
    this.matBottomSheet.open(this.matSheetTpl(), { panelClass: 'probe-mat' });
  }
}
