import {
  Component,
  computed,
  inject,
  signal,
  type EnvironmentProviders,
  type Provider,
  type TemplateRef,
  type Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';

import { CngxAccordionGroup } from '../accordion-group.component';
import { CngxAccordionItem } from '../accordion-item.component';
import type { CngxAccordionItemIconContext } from '../accordion-item-icon.directive';
import type { CngxAccordionItemStateContext } from '../accordion-item-state-context';
import { CngxAccordionItemTitle } from '../accordion-item-title.directive';
import { CNGX_ACCORDION_LANGUAGE_EN } from '../i18n/accordion-language-section';
import { CNGX_ACCORDION_CONFIG } from './accordion.config.defaults';
import { withAccordionLabels, withAccordionTemplates, withDefaultHeadingLevel } from './features';
import { resolveAccordionCopy } from './inject-accordion-config';
import { provideAccordionConfig, provideAccordionConfigAt } from './provide-accordion-config';

// Compile-checked: the English section is a complete section of a pack.
const EN_SECTION: CngxLanguagePack['accordion'] = CNGX_ACCORDION_LANGUAGE_EN;

const fakeIconTemplate = () => ({}) as unknown as TemplateRef<CngxAccordionItemIconContext>;
const fakeTemplate = () => ({}) as unknown as TemplateRef<CngxAccordionItemStateContext>;

const IMPORTS = [CngxAccordionGroup, CngxAccordionItem, CngxAccordionItemTitle];

@Component({
  template: `<cngx-accordion-group>
    <cngx-accordion-item [disabled]="true">
      <span cngxAccordionItemTitle>A</span>
    </cngx-accordion-item>
    <cngx-accordion-item [state]="'error'">
      <span cngxAccordionItemTitle>B</span>
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
  const group = fixture.debugElement
    .query(By.directive(CngxAccordionGroup))
    .injector.get(CngxAccordionGroup);
  const root = fixture.nativeElement as HTMLElement;
  const item = {
    disabledReason: () => root.querySelector('.cngx-visually-hidden')?.textContent?.trim(),
    errorMessage: () => root.querySelector('[role="alert"]')?.textContent?.trim(),
  };
  return { item, group };
}

describe('accordion config cascade', () => {
  it('falls back to the EN library defaults when unconfigured', () => {
    const { item, group } = render(UnboundHost);
    expect(item.disabledReason()).toBe('This section is currently unavailable.');
    expect(item.errorMessage()).toBe('This section could not be loaded.');
    expect(group.headingLevel()).toBe(3);
  });

  it('overrides the error message through withAccordionLabels', () => {
    const { item } = render(UnboundHost, [
      provideAccordionConfig(withAccordionLabels({ errorMessage: 'Load failed.' })),
    ]);
    expect(item.errorMessage()).toBe('Load failed.');
    // Un-set label key keeps its EN default (partial labels compose).
    expect(item.disabledReason()).toBe('This section is currently unavailable.');
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

  it('resolves plain labels over a config without copy defaults', () => {
    TestBed.configureTestingModule({
      providers: [
        provideAccordionConfig(
          withAccordionLabels({ errorMessage: 'Load failed.' }),
          withDefaultHeadingLevel(2),
        ),
      ],
    });
    expect(TestBed.inject(CNGX_ACCORDION_CONFIG)).toEqual({
      errorMessage: 'Load failed.',
      headingLevel: 2,
      skin: undefined,
      templates: {},
    });
  });

  it('follows a Signal label and keeps the resolved copy reference on an equal recompute', () => {
    const lang = signal<'en' | 'de' | 'de-AT'>('en');
    const disabledReason = computed(() =>
      lang() === 'en' ? 'This section is locked.' : 'Dieser Abschnitt ist gesperrt.',
    );
    const { item } = render(UnboundHost, [
      provideAccordionConfig(withAccordionLabels({ disabledReason })),
    ]);
    const copy = TestBed.runInInjectionContext(() =>
      resolveAccordionCopy(inject(CNGX_ACCORDION_CONFIG)),
    );
    expect(item.disabledReason()).toBe('This section is locked.');

    lang.set('de');
    TestBed.tick();
    expect(item.disabledReason()).toBe('Dieser Abschnitt ist gesperrt.');
    const german = copy();
    expect(german.errorMessage).toBe(EN_SECTION.errorMessage);

    lang.set('de-AT');
    expect(copy()).toBe(german);
  });

  it('reads the accordion section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    const { item } = render(UnboundHost, [
      provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
    ]);
    const copy = TestBed.runInInjectionContext(() =>
      resolveAccordionCopy(inject(CNGX_ACCORDION_CONFIG)),
    );
    expect(item.disabledReason()).toBe('This section is currently unavailable.');

    pack.set({ locale: 'de', accordion: { disabledReason: 'Dieser Abschnitt ist gesperrt.' } });
    TestBed.tick();
    expect(item.disabledReason()).toBe('Dieser Abschnitt ist gesperrt.');
    expect(copy().errorMessage).toBe('This section could not be loaded.');
  });

  it('lets withAccordionLabels override a key on top of the active pack', () => {
    const { item } = render(UnboundHost, [
      provideCngxI18n(
        withPartialPack({
          locale: 'de',
          accordion: {
            disabledReason: 'Dieser Abschnitt ist gesperrt.',
            errorMessage: 'Laden fehlgeschlagen.',
          },
        }),
        withDocumentLanguage('off'),
      ),
      provideAccordionConfig(withAccordionLabels({ disabledReason: 'Gesperrt.' })),
    ]);
    expect(item.disabledReason()).toBe('Gesperrt.');
    expect(item.errorMessage()).toBe('Laden fehlgeschlagen.');
  });

  it('clamps a config heading level into the ARIA 2-6 range at the group', () => {
    const { group } = render(UnboundHost, [provideAccordionConfig(withDefaultHeadingLevel(9))]);
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

  it('flows busySpinner and error tiers through withAccordionTemplates', () => {
    const busySpinner = fakeTemplate();
    const error = fakeTemplate();
    TestBed.configureTestingModule({
      providers: [provideAccordionConfig(withAccordionTemplates({ busySpinner, error }))],
    });
    const templates = TestBed.inject(CNGX_ACCORDION_CONFIG).templates;
    expect(templates?.busySpinner).toBe(busySpinner);
    expect(templates?.error).toBe(error);
  });

  it('composes icon, busySpinner and error tiers across calls without clobbering', () => {
    const icon = fakeIconTemplate();
    const busySpinner = fakeTemplate();
    const error = fakeTemplate();
    TestBed.configureTestingModule({
      providers: [
        provideAccordionConfig(
          withAccordionTemplates({ icon }),
          withAccordionTemplates({ busySpinner }),
          withAccordionTemplates({ error }),
        ),
      ],
    });
    const templates = TestBed.inject(CNGX_ACCORDION_CONFIG).templates;
    expect(templates?.icon).toBe(icon);
    expect(templates?.busySpinner).toBe(busySpinner);
    expect(templates?.error).toBe(error);
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
