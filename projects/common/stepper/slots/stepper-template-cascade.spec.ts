import { Component, provideZonelessChangeDetection, signal, type TemplateRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { createStepperTemplateBindings } from './stepper-template-cascade';
import type { CngxStepperConfig } from '../stepper-config';
import type { CngxStepBadge } from './step-badge.directive';
import type { CngxStepBusySpinner } from './step-busy-spinner.directive';
import type { CngxStepGroupHeader } from './step-group-header.directive';
import type { CngxStepIndicator } from './step-indicator.directive';
import type { CngxStepRejection } from './step-rejection.directive';
import type { CngxStepperEmpty } from './stepper-empty.directive';

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

describe('createStepperTemplateBindings - 3-stage cascade', () => {
  it('returns null on every key when no instance + no config template is supplied', () => {
    const cfg: CngxStepperConfig = {};
    const bindings = createStepperTemplateBindings({
      indicatorSlot: signal<CngxStepIndicator | undefined>(undefined),
      badgeSlot: signal<CngxStepBadge | undefined>(undefined),
      busySpinnerSlot: signal<CngxStepBusySpinner | undefined>(undefined),
      rejectionSlot: signal<CngxStepRejection | undefined>(undefined),
      groupHeaderSlot: signal<CngxStepGroupHeader | undefined>(undefined),
      emptySlot: signal<CngxStepperEmpty | undefined>(undefined),
      config: cfg,
    });
    expect(bindings.indicator()).toBeNull();
    expect(bindings.badge()).toBeNull();
    expect(bindings.busySpinner()).toBeNull();
    expect(bindings.rejection()).toBeNull();
    expect(bindings.groupHeader()).toBeNull();
    expect(bindings.empty()).toBeNull();
  });

  it('config template fills in when instance slot is undefined', () => {
    const host = makeHost();
    const cfg: CngxStepperConfig = {
      templates: {
        indicator: host.configTpl as TemplateRef<never>,
        badge: host.configTpl as TemplateRef<never>,
        busySpinner: host.configTpl as TemplateRef<never>,
        rejection: host.configTpl as TemplateRef<never>,
        groupHeader: host.configTpl as TemplateRef<never>,
        empty: host.configTpl as TemplateRef<void>,
      },
    };
    const bindings = createStepperTemplateBindings({
      indicatorSlot: signal<CngxStepIndicator | undefined>(undefined),
      badgeSlot: signal<CngxStepBadge | undefined>(undefined),
      busySpinnerSlot: signal<CngxStepBusySpinner | undefined>(undefined),
      rejectionSlot: signal<CngxStepRejection | undefined>(undefined),
      groupHeaderSlot: signal<CngxStepGroupHeader | undefined>(undefined),
      emptySlot: signal<CngxStepperEmpty | undefined>(undefined),
      config: cfg,
    });
    expect(bindings.indicator()).toBe(host.configTpl);
    expect(bindings.badge()).toBe(host.configTpl);
    expect(bindings.busySpinner()).toBe(host.configTpl);
    expect(bindings.rejection()).toBe(host.configTpl);
    expect(bindings.groupHeader()).toBe(host.configTpl);
    expect(bindings.empty()).toBe(host.configTpl);
  });

  it('instance slot wins over config templates', () => {
    const host = makeHost();
    const indicatorDir = { templateRef: host.instanceTpl } as CngxStepIndicator;
    const cfg: CngxStepperConfig = {
      templates: { indicator: host.configTpl as TemplateRef<never> },
    };
    const bindings = createStepperTemplateBindings({
      indicatorSlot: signal<CngxStepIndicator | undefined>(indicatorDir),
      badgeSlot: signal<CngxStepBadge | undefined>(undefined),
      busySpinnerSlot: signal<CngxStepBusySpinner | undefined>(undefined),
      rejectionSlot: signal<CngxStepRejection | undefined>(undefined),
      groupHeaderSlot: signal<CngxStepGroupHeader | undefined>(undefined),
      emptySlot: signal<CngxStepperEmpty | undefined>(undefined),
      config: cfg,
    });
    expect(bindings.indicator()).toBe(host.instanceTpl);
  });

  it('empty slot resolves all six keys symmetrically', () => {
    const host = makeHost();
    const allInstance = (tpl: TemplateRef<never>) => ({
      indicatorSlot: signal({ templateRef: tpl } as CngxStepIndicator),
      badgeSlot: signal({ templateRef: tpl } as CngxStepBadge),
      busySpinnerSlot: signal({ templateRef: tpl } as CngxStepBusySpinner),
      rejectionSlot: signal({ templateRef: tpl } as CngxStepRejection),
      groupHeaderSlot: signal({ templateRef: tpl } as CngxStepGroupHeader),
      emptySlot: signal({ templateRef: tpl as unknown as TemplateRef<void> } as CngxStepperEmpty),
      config: {} as CngxStepperConfig,
    });
    const bindings = createStepperTemplateBindings(
      allInstance(host.instanceTpl as TemplateRef<never>),
    );
    expect(bindings.indicator()).toBe(host.instanceTpl);
    expect(bindings.badge()).toBe(host.instanceTpl);
    expect(bindings.busySpinner()).toBe(host.instanceTpl);
    expect(bindings.rejection()).toBe(host.instanceTpl);
    expect(bindings.groupHeader()).toBe(host.instanceTpl);
    expect(bindings.empty()).toBe(host.instanceTpl);
  });
});
