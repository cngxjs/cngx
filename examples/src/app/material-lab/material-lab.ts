import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type TemplateRef,
  ViewEncapsulation,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, schema, required, email, disabled, FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBottomSheet, type MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSnackBar, MatSnackBarModule, type MatSnackBarRef } from '@angular/material/snack-bar';

import {
  CngxButton,
  CngxButtonGroup,
  CngxButtonGroupAddon,
  CngxButtonStart,
  CngxCloseButton,
  CngxIconButton,
} from '@cngx/common/button';
import { CngxAvatar, CngxIcon } from '@cngx/common/display';
import { CngxSlider, CngxRangeSlider } from '@cngx/common/interactive';
import { CngxBottomSheet, CngxDialog, CngxDialogTitle } from '@cngx/common/dialog';
import {
  CngxPopoverBody,
  CngxPopoverHeader,
  CngxPopoverPanel,
  CngxPopoverTrigger,
} from '@cngx/common/popover';
import { CngxAlert, CngxBanner, CngxBannerOutlet, CngxToaster } from '@cngx/ui/feedback';
import {
  CngxAccordionGroup,
  CngxAccordionItem,
  CngxAccordionItemTitle,
} from '@cngx/ui/accordion';
import {
  CngxSelect,
  CngxMultiSelect,
  CngxCombobox,
  CngxTypeahead,
  CngxTreeSelect,
  CngxReorderableMultiSelect,
  CngxActionSelect,
  CngxActionMultiSelect,
  CngxSelectShell,
  CngxSelectOption,
  CngxSelectAction,
  type CngxSelectCreateAction,
  type CngxSelectOptionDef,
} from '@cngx/forms/select';
import {
  CngxFormField,
  CngxLabel,
  CngxHint,
  CngxFieldErrors,
  CngxFormErrors,
} from '@cngx/forms/field';
import {
  CngxInput,
  CngxPasswordToggle,
  CngxCharCount,
  CngxInputClear,
  CngxAutosize,
} from '@cngx/forms/input';
import type { CngxTreeNode } from '@cngx/utils';

interface FieldModel {
  name: string;
  password: string;
  bio: string;
  about: string;
  clearable: string;
  reqName: string;
  errEmail: string;
  locked: string;
}

/**
 * Local Material-bridge fidelity harness (not generated, not shipped). Renders
 * every cngx select-family variant, the cngx-form-field + cngxInput family, and
 * the form-field state matrix (required / error / disabled / form-error summary)
 * with the working-tree Material bridge, side by side with a real Angular
 * Material counterpart wherever a clean equivalent exists, under the same M3
 * azure theme. This is the only working-tree-faithful preview of the bridge: the
 * SCSS `@use`s the bridges via relative source paths, whereas the compodocx
 * StackBlitz playgrounds pin published rc.3.
 *
 * Scope note: only `cngxInput` provides `CNGX_FORM_FIELD_CONTROL`, so the
 * field bridge (`field-theme.scss`, scoped to `:where(cngx-form-field)`) themes
 * the cngxInput family shown here. The standalone formatting behaviours
 * (numeric / mask / otp / format / copy-value / file-drop) live in their own
 * story routes and are outside that scope.
 *
 * Route: `/#/material-lab`.
 */
@Component({
  selector: 'app-material-lab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  // Component-scoped banner stack so the dismissible banner renders inside the
  // lab section (its own outlet) instead of the app-level outlet at the top.
  providers: [CngxBanner],
  imports: [
    FormsModule,
    FormField,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatSliderModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    CngxAlert,
    CngxBannerOutlet,
    CngxBottomSheet,
    CngxDialog,
    CngxDialogTitle,
    CngxPopoverBody,
    CngxPopoverHeader,
    CngxPopoverPanel,
    CngxPopoverTrigger,
    CngxButton,
    CngxButtonGroup,
    CngxButtonGroupAddon,
    CngxButtonStart,
    CngxCloseButton,
    CngxIconButton,
    CngxAvatar,
    CngxIcon,
    CngxSlider,
    CngxRangeSlider,
    CngxAccordionGroup,
    CngxAccordionItem,
    CngxAccordionItemTitle,
    CngxSelect,
    CngxMultiSelect,
    CngxCombobox,
    CngxTypeahead,
    CngxTreeSelect,
    CngxReorderableMultiSelect,
    CngxActionSelect,
    CngxActionMultiSelect,
    CngxSelectShell,
    CngxSelectOption,
    CngxSelectAction,
    CngxFormField,
    CngxLabel,
    CngxHint,
    CngxFieldErrors,
    CngxFormErrors,
    CngxInput,
    CngxPasswordToggle,
    CngxCharCount,
    CngxInputClear,
    CngxAutosize,
  ],
  template: `
    <div class="lab mat-app-background mat-typography">
      <section class="lab-wide">
        <h3>buttons (Material left, cngx right)</h3>
        <div class="lab-row">
          <button mat-flat-button>Save</button>
          <button cngxButton tone="primary">Save</button>
          <button matButton="tonal">Save draft</button>
          <button cngxButton="secondary">Save draft</button>
        </div>
        <div class="lab-row">
          <button mat-stroked-button>Export</button>
          <button cngxButton="outline">Export</button>
          <button mat-button>Cancel</button>
          <button cngxButton="ghost" tone="primary">Cancel</button>
        </div>
        <div class="lab-row">
          <button mat-flat-button><mat-icon>add</mat-icon>New item</button>
          <button cngxButton tone="primary">
            <cngx-icon cngxButtonStart><mat-icon>add</mat-icon></cngx-icon>New item
          </button>
          <button matIconButton aria-label="Delete"><mat-icon>delete</mat-icon></button>
          <button cngxIconButton aria-label="Delete">
            <cngx-icon><mat-icon>delete</mat-icon></cngx-icon>
          </button>
        </div>
        <div class="lab-row">
          <button mat-flat-button disabled>Disabled</button>
          <button cngxButton tone="primary" disabled>Disabled</button>
          <button cngxButton tone="danger">Delete</button>
          <button cngxButton="secondary" tone="danger">Discard</button>
        </div>
        <div class="lab-row">
          <button matIconButton aria-label="Close panel"><mat-icon>close</mat-icon></button>
          <button cngxCloseButton aria-label="Close panel"></button>
          <div cngxButtonGroup variant="outline" aria-label="Assignee">
            <span cngxButtonGroupAddon><cngx-avatar initials="AL" size="xs" />Ada Lovelace</span>
            <button cngxButton>Reassign</button>
          </div>
          <div cngxButtonGroup variant="outline" aria-label="Issues">
            <span cngxButtonGroupAddon>3 open</span>
            <button cngxButton>Show</button>
          </div>
        </div>
      </section>

      <section class="lab-wide" id="close-hosts">
        <h3>close buttons in context (Material left where it exists, cngx right)</h3>

        <div class="lab-pair">
          <mat-card appearance="outlined" class="lab-host lab-host--mat-alert">
            <mat-card-header>
              <mat-card-title>Unsaved changes</mat-card-title>
              <button matIconButton aria-label="Dismiss notice" class="lab-host-close">
                <mat-icon>close</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content>Your changes will be lost if you leave this page.</mat-card-content>
          </mat-card>
          <cngx-alert class="lab-host" severity="warning" title="Unsaved changes" [closable]="true">
            Your changes will be lost if you leave this page.
          </cngx-alert>
        </div>

        <div class="lab-pair">
          <span class="lab-pair-label">banner (cngx only)</span>
          <cngx-banner-outlet class="lab-host lab-host--banner" />
          <button cngxButton="outline" (click)="showBanner()">Show banner</button>
        </div>

        <div class="lab-row">
          <button cngxButton="outline" (click)="openMatSnack()">MatSnackBar</button>
          <button cngxButton="outline" (click)="showToast()">CngxToaster toast</button>
          <button cngxButton="outline" (click)="openMatSheet()">MatBottomSheet</button>
          <button cngxButton="outline" (click)="cngxSheet.open()">CngxBottomSheet</button>
          <button cngxButton="outline" (click)="openMatDialog()">MatDialog</button>
          <button cngxButton="outline" (click)="cngxDlg.open()">CngxDialog</button>
          <button
            cngxButton="outline"
            [cngxPopoverTrigger]="labPanel.popover"
            (click)="labPanel.popover.toggle()"
          >
            Popover panel (cngx only)
          </button>
        </div>

        <cngx-popover-panel #labPanel [showClose]="true" placement="bottom-start">
          <span cngxPopoverHeader>Recent activity</span>
          <ul cngxPopoverBody class="lab-host-list">
            <li>Invoice 1042 was paid</li>
            <li>Anna joined the workspace</li>
          </ul>
        </cngx-popover-panel>

        <dialog cngxDialog cngxBottomSheet #cngxSheet="cngxDialog" class="lab-host--cngx-sheet">
          <div class="lab-host-head">
            <h2 cngxDialogTitle>Share options</h2>
            <button cngxCloseButton aria-label="Close share options" (click)="cngxSheet.dismiss()"></button>
          </div>
          <p>Copy the link or send it by email.</p>
        </dialog>

        <dialog cngxDialog #cngxDlg="cngxDialog" class="lab-host--cngx-dialog">
          <div class="lab-host-head">
            <h2 cngxDialogTitle>Delete project</h2>
            <button cngxCloseButton aria-label="Close delete project dialog" (click)="cngxDlg.dismiss()"></button>
          </div>
          <p>This removes the project and all of its files.</p>
        </dialog>

        <ng-template #matSnackTpl>
          <div class="lab-snack">
            <span matSnackBarLabel>Message archived. It moves to the archive folder and stays there for 30 days.</span>
            <span matSnackBarActions>
              <button matButton matSnackBarAction (click)="matSnackRef?.dismissWithAction()">Undo</button>
              <button matIconButton aria-label="Dismiss" class="lab-host-close" (click)="matSnackRef?.dismiss()">
                <mat-icon>close</mat-icon>
              </button>
            </span>
          </div>
        </ng-template>

        <ng-template #matSheetTpl>
          <div class="lab-host-head lab-host--mat-sheet">
            <h2 class="mat-title-medium">Share options</h2>
            <button matIconButton aria-label="Close share options" class="lab-host-close" (click)="matSheetRef?.dismiss()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <p>Copy the link or send it by email.</p>
        </ng-template>

        <ng-template #matDialogTpl>
          <div class="lab-host-head lab-host--mat-dialog">
            <h2 mat-dialog-title>Delete project</h2>
            <button matIconButton mat-dialog-close aria-label="Close delete project dialog" class="lab-host-close">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <mat-dialog-content>This removes the project and all of its files.</mat-dialog-content>
        </ng-template>
      </section>

      <section>
        <h3>single-select (minimal)</h3>
        <cngx-select
          class="probe-cngx"
          [label]="'Color'"
          [options]="colors"
          [(value)]="simpleValue"
        />

        <mat-form-field appearance="outline">
          <mat-label>Color</mat-label>
          <mat-select [(ngModel)]="matSimpleValue" class="probe-mat">
            @for (c of colors; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </section>

      <section>
        <h3>single-select</h3>
        <cngx-select
          class="probe-cngx"
          [label]="'Favorite color'"
          [options]="colors"
          [(value)]="singleValue"
          [clearable]="true"
          [selectionIndicatorPosition]="'after'"
          placeholder="Pick a color..."
        />

        <mat-form-field appearance="outline">
          <mat-label>Favorite color</mat-label>
          <mat-select [(ngModel)]="matSingleValue" class="probe-mat">
            @for (c of colors; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </section>

      <section>
        <h3>multi-select</h3>
        <cngx-multi-select
          class="probe-cngx"
          [label]="'Favorite colors'"
          [options]="colors"
          [(values)]="multiValues"
          [clearable]="true"
          [chipOverflow]="'truncate'"
          placeholder="Pick a few colors..."
        />

        <mat-form-field appearance="outline">
          <mat-label>Favorite colors</mat-label>
          <mat-select multiple [(ngModel)]="matMultiValues" class="probe-mat">
            @for (c of colors; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-chip-set>
          @for (v of matMultiValues; track v) {
            <mat-chip>{{ labelOf(v) }}</mat-chip>
          }
        </mat-chip-set>
      </section>

      <section>
        <h3>slider (single)</h3>
        <cngx-slider
          class="probe-cngx"
          aria-label="Volume"
          [(value)]="sliderValue"
          [min]="0"
          [max]="100"
          [step]="5"
        />

        <mat-slider min="0" max="100" step="5" class="probe-mat">
          <input matSliderThumb [(ngModel)]="matSliderValue" aria-label="Volume" />
        </mat-slider>
      </section>

      <section>
        <h3>slider (range)</h3>
        <cngx-range-slider
          class="probe-cngx"
          aria-label="Price range"
          [(value)]="rangeValue"
          [min]="0"
          [max]="1000"
          [step]="10"
        />

        <mat-slider min="0" max="1000" step="10" class="probe-mat">
          <input matSliderStartThumb [(ngModel)]="matRangeStart" aria-label="Minimum" />
          <input matSliderEndThumb [(ngModel)]="matRangeEnd" aria-label="Maximum" />
        </mat-slider>
      </section>

      <section>
        <h3>accordion</h3>
        <cngx-accordion-group class="probe-cngx" [headingLevel]="3">
          <cngx-accordion-item>
            <span cngxAccordionItemTitle>Shipping</span>
            Free shipping on orders over $50.
          </cngx-accordion-item>
          <cngx-accordion-item>
            <span cngxAccordionItemTitle>Returns</span>
            Returns accepted within 30 days of delivery.
          </cngx-accordion-item>
          <cngx-accordion-item [disabled]="true">
            <span cngxAccordionItemTitle>Warranty</span>
            Two-year limited warranty.
          </cngx-accordion-item>
        </cngx-accordion-group>

        <mat-accordion class="probe-mat">
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Shipping</mat-panel-title>
            </mat-expansion-panel-header>
            Free shipping on orders over $50.
          </mat-expansion-panel>
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Returns</mat-panel-title>
            </mat-expansion-panel-header>
            Returns accepted within 30 days of delivery.
          </mat-expansion-panel>
          <mat-expansion-panel disabled>
            <mat-expansion-panel-header>
              <mat-panel-title>Warranty</mat-panel-title>
            </mat-expansion-panel-header>
            Two-year limited warranty.
          </mat-expansion-panel>
        </mat-accordion>
      </section>

      <section>
        <h3>typeahead</h3>
        <cngx-typeahead
          class="probe-cngx"
          [label]="'Favorite color'"
          [options]="colors"
          [(value)]="typeaheadValue"
          [displayWith]="displayWith"
          placeholder="Type to filter..."
        />

        <mat-form-field appearance="outline">
          <mat-label>Favorite color</mat-label>
          <input
            matInput
            class="probe-mat"
            [(ngModel)]="matTypeaheadText"
            [matAutocomplete]="typeaheadAuto"
            placeholder="Type to filter..."
          />
          <mat-autocomplete #typeaheadAuto="matAutocomplete">
            @for (c of colors; track c.value) {
              <mat-option [value]="c.label">{{ c.label }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
      </section>

      <section>
        <h3>combobox</h3>
        <cngx-combobox
          class="probe-cngx"
          [label]="'Favorite colors'"
          [options]="colors"
          [(values)]="comboboxValues"
          placeholder="Type to filter..."
        />

        <mat-form-field appearance="outline">
          <mat-label>Favorite colors</mat-label>
          <mat-chip-grid #comboboxGrid class="probe-mat">
            @for (v of matComboboxValues; track v) {
              <mat-chip-row>{{ labelOf(v) }}</mat-chip-row>
            }
          </mat-chip-grid>
          <input
            placeholder="Type to filter..."
            [matChipInputFor]="comboboxGrid"
            [matAutocomplete]="comboboxAuto"
          />
          <mat-autocomplete #comboboxAuto="matAutocomplete">
            @for (c of colors; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
      </section>

      <section>
        <h3>tree-select (cngx only)</h3>
        <cngx-tree-select
          class="probe-cngx"
          [label]="'Regions'"
          [nodes]="nodes"
          [nodeIdFn]="nodeIdFn"
          [(values)]="treeValues"
          [cascadeChildren]="true"
          placeholder="Pick regions..."
        />
      </section>

      <section>
        <h3>reorderable-multi-select (cngx only)</h3>
        <cngx-reorderable-multi-select
          class="probe-cngx"
          [label]="'Workflow steps'"
          [options]="steps"
          [(values)]="reorderableValues"
          placeholder="Pick steps..."
        />
      </section>

      <section>
        <h3>action-select (cngx only)</h3>
        <cngx-action-select
          class="probe-cngx"
          [label]="'Favorite color'"
          [options]="colors"
          [(value)]="actionValue"
          [quickCreateAction]="createColor"
          [clearable]="true"
          placeholder="Pick a color..."
        >
          <ng-template cngxSelectAction let-term let-commit="commit" let-pending="isPending">
            <button type="button" [disabled]="!term || pending" (click)="commit()">
              Create "{{ term }}"
            </button>
          </ng-template>
        </cngx-action-select>
      </section>

      <section>
        <h3>action-multi-select (cngx only)</h3>
        <cngx-action-multi-select
          class="probe-cngx"
          [label]="'Favorite colors'"
          [options]="colors"
          [(values)]="actionMultiValues"
          [quickCreateAction]="createColor"
          [clearable]="true"
          [chipOverflow]="'truncate'"
          placeholder="Pick colors..."
        >
          <ng-template cngxSelectAction let-term let-commit="commit" let-pending="isPending">
            <button type="button" [disabled]="!term || pending" (click)="commit()">
              Create "{{ term }}"
            </button>
          </ng-template>
        </cngx-action-multi-select>
      </section>

      <section>
        <h3>select-shell (cngx only)</h3>
        <cngx-select-shell
          class="probe-cngx"
          [label]="'Favorite color'"
          [(value)]="shellValue"
          placeholder="Pick a color..."
        >
          <cngx-option [value]="'red'">Red</cngx-option>
          <cngx-option [value]="'green'">Green</cngx-option>
          <cngx-option [value]="'blue'">Blue</cngx-option>
          <cngx-option [value]="'amber'">Amber</cngx-option>
          <cngx-option [value]="'violet'">Violet</cngx-option>
        </cngx-select-shell>
      </section>

      <section>
        <h3>input: text + hint</h3>
        <cngx-form-field [field]="fieldForm.name">
          <label cngxLabel>Full name</label>
          <input
            cngxInput
            class="probe-cngx"
            [formField]="fieldForm.name"
            placeholder="Ada Lovelace"
          />
          <span cngxHint>As it appears on your ID</span>
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Full name</mat-label>
          <input matInput class="probe-mat" [(ngModel)]="matName" placeholder="Ada Lovelace" />
          <mat-hint>As it appears on your ID</mat-hint>
        </mat-form-field>
      </section>

      <section>
        <h3>input: password (toggle)</h3>
        <cngx-form-field [field]="fieldForm.password">
          <label cngxLabel>Password</label>
          <input
            cngxInput
            cngxPasswordToggle
            #pwd="cngxPasswordToggle"
            class="probe-cngx"
            [formField]="fieldForm.password"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            class="lab-inline-btn"
            (click)="pwd.toggle()"
            [attr.aria-label]="pwd.visible() ? 'Hide password' : 'Show password'"
          >
            {{ pwd.visible() ? 'Hide' : 'Show' }}
          </button>
          <span cngxHint>8-64 characters</span>
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input
            matInput
            class="probe-mat"
            type="password"
            [(ngModel)]="matPassword"
            placeholder="At least 8 characters"
          />
          <mat-hint>8-64 characters</mat-hint>
        </mat-form-field>
      </section>

      <section>
        <h3>input: textarea + char-count</h3>
        <cngx-form-field [field]="fieldForm.bio">
          <label cngxLabel>Bio</label>
          <textarea
            cngxInput
            class="probe-cngx"
            [formField]="fieldForm.bio"
            rows="3"
            placeholder="Tell us about yourself..."
            style="resize:vertical;width:100%"
          ></textarea>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span cngxHint>10-140 characters</span>
            <cngx-char-count [max]="140" />
          </div>
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Bio</mat-label>
          <textarea
            matInput
            class="probe-mat"
            #matBioRef
            [(ngModel)]="matBio"
            rows="3"
            maxlength="140"
            placeholder="Tell us about yourself..."
          ></textarea>
          <mat-hint align="start">10-140 characters</mat-hint>
          <mat-hint align="end">{{ matBioRef.value.length }} / 140</mat-hint>
        </mat-form-field>
      </section>

      <section>
        <h3>input: autosize textarea</h3>
        <cngx-form-field [field]="fieldForm.about">
          <label cngxLabel>About</label>
          <textarea
            cngxInput
            cngxAutosize
            class="probe-cngx"
            [formField]="fieldForm.about"
            placeholder="Grows as you type..."
            style="width:100%"
          ></textarea>
          <span cngxHint>Grows with content</span>
        </cngx-form-field>
      </section>

      <section>
        <h3>input: clearable</h3>
        <cngx-form-field [field]="fieldForm.clearable">
          <label cngxLabel>Search</label>
          <input
            cngxInput
            #clearInput
            class="probe-cngx"
            [formField]="fieldForm.clearable"
            placeholder="Type, then clear"
          />
          <button
            type="button"
            class="lab-inline-btn"
            [cngxInputClear]="clearInput"
            #clr="cngxInputClear"
            [style.opacity]="clr.hasValue() ? 1 : 0.35"
          >
            Clear
          </button>
        </cngx-form-field>
      </section>

      <section>
        <h3>state: required</h3>
        <cngx-form-field [field]="fieldForm.reqName">
          <label cngxLabel>Display name</label>
          <input cngxInput class="probe-cngx" [formField]="fieldForm.reqName" />
          <cngx-field-errors />
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Display name</mat-label>
          <input matInput class="probe-mat" required [(ngModel)]="matReqName" />
        </mat-form-field>
      </section>

      <section>
        <h3>state: error (invalid)</h3>
        <cngx-form-field [field]="fieldForm.errEmail">
          <label cngxLabel>Email</label>
          <input cngxInput class="probe-cngx" [formField]="fieldForm.errEmail" />
          <cngx-field-errors />
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input
            matInput
            class="probe-mat"
            #matEmailRef="ngModel"
            required
            email
            [(ngModel)]="matErrEmail"
          />
          @if (matEmailRef.invalid) {
            <mat-error>Enter a valid email address</mat-error>
          }
        </mat-form-field>
      </section>

      <section>
        <h3>state: disabled</h3>
        <cngx-form-field [field]="fieldForm.locked">
          <label cngxLabel>Account ID</label>
          <input cngxInput class="probe-cngx" [formField]="fieldForm.locked" />
          <span cngxHint>Assigned at signup</span>
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Account ID</mat-label>
          <input matInput class="probe-mat" disabled [(ngModel)]="matLocked" />
          <mat-hint>Assigned at signup</mat-hint>
        </mat-form-field>
      </section>

      <section>
        <h3>state: form-error summary (cngx only)</h3>
        <cngx-form-errors
          class="probe-cngx"
          [fields]="[fieldForm.reqName, fieldForm.errEmail]"
          [show]="showSummary()"
        />
      </section>
    </div>
  `,
})
export class MaterialLab {
  protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'amber', label: 'Amber' },
    { value: 'violet', label: 'Violet' },
  ];

  protected readonly steps: CngxSelectOptionDef<string>[] = [
    { value: 'build', label: 'Build' },
    { value: 'test', label: 'Test' },
    { value: 'deploy', label: 'Deploy' },
    { value: 'lint', label: 'Lint' },
    { value: 'release', label: 'Release' },
  ];

  protected readonly nodes: CngxTreeNode<string>[] = [
    {
      value: 'europe',
      label: 'Europe',
      children: [
        { value: 'austria', label: 'Austria' },
        { value: 'germany', label: 'Germany' },
        { value: 'france', label: 'France' },
      ],
    },
    {
      value: 'americas',
      label: 'Americas',
      children: [
        { value: 'usa', label: 'United States' },
        { value: 'canada', label: 'Canada' },
        { value: 'brazil', label: 'Brazil' },
      ],
    },
  ];

  protected readonly nodeIdFn = (value: string): string => value;

  protected readonly displayWith = (value: string): string =>
    this.colors.find((c) => c.value === value)?.label ?? value;

  // One distinct signal per cngx probe; no shared mutable state across variants.
  protected readonly simpleValue = signal<string | undefined>(undefined);
  protected readonly singleValue = signal<string | undefined>(undefined);
  protected readonly sliderValue = signal<number>(40);
  protected readonly rangeValue = signal<[number, number]>([200, 800]);
  protected readonly multiValues = signal<string[]>(['red', 'green']);
  protected readonly typeaheadValue = signal<string | undefined>(undefined);
  protected readonly comboboxValues = signal<string[]>([]);
  protected readonly treeValues = signal<string[]>([]);
  protected readonly reorderableValues = signal<string[]>(['build', 'test', 'deploy']);
  protected readonly actionValue = signal<string | undefined>(undefined);
  protected readonly actionMultiValues = signal<string[]>([]);
  protected readonly createColor: CngxSelectCreateAction<string> = (term) => term;
  protected readonly shellValue = signal<string | undefined>(undefined);

  // Signal Forms model backing the cngx-form-field probes. `errEmail` carries an
  // invalid value and `locked` is schema-disabled so the error and disabled
  // states render on load without interaction.
  protected readonly fieldModel = signal<FieldModel>({
    name: '',
    password: '',
    bio: '',
    about: '',
    clearable: '',
    reqName: '',
    errEmail: 'not-an-email',
    locked: 'ACC-100425',
  });

  protected readonly fieldForm = form(
    this.fieldModel,
    schema<FieldModel>((root) => {
      required(root.reqName);
      required(root.errEmail);
      email(root.errEmail);
      disabled(root.locked);
    }),
  );

  protected readonly showSummary = signal(true);

  // Material counterpart state (plain bindings; no shared identity with cngx probes).
  protected matSimpleValue: string | undefined = undefined;
  protected matSingleValue: string | undefined = undefined;
  protected matSliderValue = 40;
  protected matRangeStart = 200;
  protected matRangeEnd = 800;
  protected matMultiValues: string[] = ['red', 'green'];
  protected matTypeaheadText = '';
  protected matComboboxValues: string[] = [];
  protected matName = '';
  protected matPassword = '';
  protected matBio = '';
  protected matReqName = '';
  protected matErrEmail = 'not-an-email';
  protected matLocked = 'ACC-100425';

  constructor() {
    // The lab sheet (full Material theme + every bridge) outgrows the
    // examples-wide anyComponentStyle budget, so it ships as the non-injected
    // `material-lab-theme` global bundle with its own budget (angular.json). It is
    // linked while the lab is mounted, so the 16px root and the Material
    // theme leave with it, as they did as a component style.
    const doc = inject(DOCUMENT);
    const sheet = doc.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = 'material-lab-theme.css';
    doc.head.appendChild(sheet);
    inject(DestroyRef).onDestroy(() => sheet.remove());

    // Pre-touch the required/invalid fields so their error styling is visible on
    // load — this is a fidelity harness, not an interaction demo.
    this.fieldForm.reqName().markAsTouched();
    this.fieldForm.errEmail().markAsTouched();

    this.showBanner();
  }

  private readonly toaster = inject(CngxToaster);
  private readonly banner = inject(CngxBanner);
  private readonly matDialog = inject(MatDialog);
  private readonly matBottomSheet = inject(MatBottomSheet);
  private readonly matSnackBar = inject(MatSnackBar);
  private readonly matSnackTpl = viewChild.required<TemplateRef<unknown>>('matSnackTpl');
  private readonly matSheetTpl = viewChild.required<TemplateRef<unknown>>('matSheetTpl');
  private readonly matDialogTpl = viewChild.required<TemplateRef<unknown>>('matDialogTpl');
  protected matSnackRef: MatSnackBarRef<unknown> | undefined;
  protected matSheetRef: MatBottomSheetRef<unknown> | undefined;

  protected showBanner(): void {
    this.banner.show({
      id: 'lab:maintenance',
      severity: 'warning',
      message: 'Scheduled maintenance tonight from 22:00 to 23:00 UTC.',
      dismissible: true,
    });
  }

  protected showToast(): void {
    this.toaster.show({
      message: 'Message archived',
      title: 'Archived',
      description: 'It moves to the archive folder and stays there for 30 days.',
      severity: 'info',
      duration: 'persistent',
      action: { label: 'Undo', handler: () => undefined },
    });
  }

  protected openMatSnack(): void {
    this.matSnackRef = this.matSnackBar.openFromTemplate(this.matSnackTpl());
  }

  protected openMatSheet(): void {
    this.matSheetRef = this.matBottomSheet.open(this.matSheetTpl());
  }

  protected openMatDialog(): void {
    this.matDialog.open(this.matDialogTpl(), { width: '360px' });
  }

  protected labelOf(value: string): string {
    return this.colors.find((c) => c.value === value)?.label ?? value;
  }
}
