import {
  Component,
  provideZonelessChangeDetection,
  signal,
  type TemplateRef,
  ViewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { createTabGroupTemplateBindings } from './tab-group-template-cascade';
import type { CngxTabsConfig } from '../tabs-config';
import type { CngxTabBusySpinner } from './tab-busy-spinner.directive';
import type { CngxTabErrorBadge } from './tab-error-badge.directive';
import type { CngxTabRejectionIcon } from './tab-rejection-icon.directive';

@Component({
  standalone: true,
  selector: 'tpl-host',
  template: `
    <ng-template #instanceTpl>instance</ng-template>
    <ng-template #configTpl>config</ng-template>
  `,
})
class TplHost {
  @ViewChild('instanceTpl', { static: true }) instanceTpl!: TemplateRef<unknown>;
  @ViewChild('configTpl', { static: true }) configTpl!: TemplateRef<unknown>;
}

function makeHost(): TplHost {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(TplHost);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('createTabGroupTemplateBindings — 3-stage cascade', () => {
  it('returns null on every key when no instance + no config template is supplied', () => {
    const cfg: CngxTabsConfig = {};
    const bindings = createTabGroupTemplateBindings({
      errorBadgeSlot: signal<CngxTabErrorBadge | undefined>(undefined),
      rejectionIconSlot: signal<CngxTabRejectionIcon | undefined>(undefined),
      busySpinnerSlot: signal<CngxTabBusySpinner | undefined>(undefined),
      config: cfg,
    });
    expect(bindings.errorBadge()).toBeNull();
    expect(bindings.rejectionIcon()).toBeNull();
    expect(bindings.busySpinner()).toBeNull();
  });

  it('config template fills in when instance slot is undefined', () => {
    const host = makeHost();
    const cfg: CngxTabsConfig = {
      templates: {
        errorBadge: host.configTpl as TemplateRef<never>,
        rejectionIcon: host.configTpl as TemplateRef<never>,
        busySpinner: host.configTpl as TemplateRef<never>,
      },
    };
    const bindings = createTabGroupTemplateBindings({
      errorBadgeSlot: signal<CngxTabErrorBadge | undefined>(undefined),
      rejectionIconSlot: signal<CngxTabRejectionIcon | undefined>(undefined),
      busySpinnerSlot: signal<CngxTabBusySpinner | undefined>(undefined),
      config: cfg,
    });
    expect(bindings.errorBadge()).toBe(host.configTpl);
    expect(bindings.rejectionIcon()).toBe(host.configTpl);
    expect(bindings.busySpinner()).toBe(host.configTpl);
  });

  it('instance slot wins over config templates', () => {
    const host = makeHost();
    const errorBadgeDir = {
      templateRef: host.instanceTpl,
    } as CngxTabErrorBadge;
    const cfg: CngxTabsConfig = {
      templates: { errorBadge: host.configTpl as TemplateRef<never> },
    };
    const bindings = createTabGroupTemplateBindings({
      errorBadgeSlot: signal<CngxTabErrorBadge | undefined>(errorBadgeDir),
      rejectionIconSlot: signal<CngxTabRejectionIcon | undefined>(undefined),
      busySpinnerSlot: signal<CngxTabBusySpinner | undefined>(undefined),
      config: cfg,
    });
    expect(bindings.errorBadge()).toBe(host.instanceTpl);
  });

  it('all three keys resolve symmetrically when every instance slot is bound', () => {
    const host = makeHost();
    const tpl = host.instanceTpl;
    const bindings = createTabGroupTemplateBindings({
      errorBadgeSlot: signal({ templateRef: tpl } as CngxTabErrorBadge),
      rejectionIconSlot: signal({ templateRef: tpl } as CngxTabRejectionIcon),
      busySpinnerSlot: signal({ templateRef: tpl } as CngxTabBusySpinner),
      config: {} as CngxTabsConfig,
    });
    expect(bindings.errorBadge()).toBe(tpl);
    expect(bindings.rejectionIcon()).toBe(tpl);
    expect(bindings.busySpinner()).toBe(tpl);
  });
});
