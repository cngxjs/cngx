import {
  Component,
  inject,
  type EnvironmentProviders,
  type Provider,
  type TemplateRef,
  type Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxAccordionGroup } from '../accordion-group.component';
import { CngxAccordionItem } from '../accordion-item.component';
import type { CngxAccordionItemIconContext } from '../accordion-item-icon.directive';
import { CngxAccordionItemTitle } from '../accordion-item-title.directive';
import { CNGX_ACCORDION_CONFIG } from './accordion.config.defaults';
import { withAccordionLabels, withAccordionTemplates, withDefaultHeadingLevel } from './features';
import { provideAccordionConfig, provideAccordionConfigAt } from './provide-accordion-config';

const fakeIconTemplate = () => ({}) as unknown as TemplateRef<CngxAccordionItemIconContext>;

const IMPORTS = [CngxAccordionGroup, CngxAccordionItem, CngxAccordionItemTitle];

@Component({
  template: `<cngx-accordion-group>
    <cngx-accordion-item [disabled]="true">
      <span cngxAccordionItemTitle>A</span>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
  imports: IMPORTS,
})
class UnboundHost {}

@Component({
  template: `<cngx-accordion-group [headingLevel]="5">
    <cngx-accordion-item [disabled]="true" [disabledReason]="'per-instance'">
      <span cngxAccordionItemTitle>A</span>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
  imports: IMPORTS,
})
class BoundHost {}

@Component({
  template: `<cngx-accordion-group>
    <cngx-accordion-item [disabled]="true">
      <span cngxAccordionItemTitle>A</span>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
  viewProviders: [
    provideAccordionConfigAt(
      withAccordionLabels({ disabledReason: 'scoped' }),
      withDefaultHeadingLevel(4),
    ),
  ],
  imports: IMPORTS,
})
class ScopedHost {}

function render(host: Type<unknown>, providers: (Provider | EnvironmentProviders)[] = []) {
  TestBed.configureTestingModule({ imports: [host], providers });
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  const item = fixture.debugElement.query(By.directive(CngxAccordionItem)).injector.get(CngxAccordionItem);
  const group = fixture.debugElement.query(By.directive(CngxAccordionGroup)).injector.get(CngxAccordionGroup);
  return { item, group };
}

describe('accordion config cascade', () => {
  it('falls back to the EN library defaults when unconfigured', () => {
    const { item, group } = render(UnboundHost);
    expect(item.disabledReason()).toBe('This section is currently unavailable.');
    expect(group.headingLevel()).toBe(3);
  });

  it('resolves the root provideAccordionConfig over the defaults', () => {
    const { item, group } = render(UnboundHost, [
      provideAccordionConfig(
        withAccordionLabels({ disabledReason: 'root' }),
        withDefaultHeadingLevel(2),
      ),
    ]);
    expect(item.disabledReason()).toBe('root');
    expect(group.headingLevel()).toBe(2);
  });

  it('resolves provideAccordionConfigAt over the root provider', () => {
    const { item, group } = render(ScopedHost, [
      provideAccordionConfig(
        withAccordionLabels({ disabledReason: 'root' }),
        withDefaultHeadingLevel(2),
      ),
    ]);
    expect(item.disabledReason()).toBe('scoped');
    expect(group.headingLevel()).toBe(4);
  });

  it('lets a per-instance input win over the config', () => {
    const { item, group } = render(BoundHost, [
      provideAccordionConfig(
        withAccordionLabels({ disabledReason: 'root' }),
        withDefaultHeadingLevel(2),
      ),
    ]);
    expect(item.disabledReason()).toBe('per-instance');
    expect(group.headingLevel()).toBe(5);
  });

  it('clamps a config heading level into the ARIA 2-6 range at the group', () => {
    const { group } = render(UnboundHost, [
      provideAccordionConfig(withDefaultHeadingLevel(9)),
    ]);
    expect(group.headingLevel()).toBe(6);
  });

  it('empty provideAccordionConfig preserves the default reference (no allocation)', () => {
    TestBed.configureTestingModule({});
    const base = TestBed.inject(CNGX_ACCORDION_CONFIG);
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({ providers: [provideAccordionConfig()] });
    // Empty features short-circuit: the root default reference flows through
    // untouched rather than a fresh (identical-content) allocation.
    expect(TestBed.inject(CNGX_ACCORDION_CONFIG)).toBe(base);
  });

  it('flows an app-wide chevron template through withAccordionTemplates', () => {
    const icon = fakeIconTemplate();
    TestBed.configureTestingModule({
      providers: [provideAccordionConfig(withAccordionTemplates({ icon }))],
    });
    expect(TestBed.inject(CNGX_ACCORDION_CONFIG).templates?.icon).toBe(icon);
  });

  it('lets provideAccordionConfigAt override the root chevron template', () => {
    const rootIcon = fakeIconTemplate();
    const scopedIcon = fakeIconTemplate();

    @Component({
      selector: 'scoped-template-host',
      template: '',
      viewProviders: [provideAccordionConfigAt(withAccordionTemplates({ icon: scopedIcon }))],
    })
    class ScopedTemplateHost {
      readonly config = inject(CNGX_ACCORDION_CONFIG);
    }

    TestBed.configureTestingModule({
      imports: [ScopedTemplateHost],
      providers: [provideAccordionConfig(withAccordionTemplates({ icon: rootIcon }))],
    });
    const fixture = TestBed.createComponent(ScopedTemplateHost);
    expect(fixture.componentInstance.config.templates?.icon).toBe(scopedIcon);
  });

  it('empty provideAccordionConfigAt passes the parent reference through unchanged', () => {
    @Component({
      selector: 'passthrough-host',
      template: '',
      viewProviders: [provideAccordionConfigAt()],
    })
    class PassthroughHost {
      readonly config = inject(CNGX_ACCORDION_CONFIG);
    }

    TestBed.configureTestingModule({ imports: [PassthroughHost] });
    const base = TestBed.inject(CNGX_ACCORDION_CONFIG);
    const fixture = TestBed.createComponent(PassthroughHost);
    expect(fixture.componentInstance.config).toBe(base);
  });
});
