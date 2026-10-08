import { Component, computed, Directive, signal, type TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';

import type { CngxTocItemContext } from '../toc.types';
import type { CngxTocAriaLabels } from './toc.config';
import { CNGX_TOC_LANGUAGE_EN } from '../i18n/toc-language-section';
import { CNGX_TOC_CONFIG, CNGX_TOC_DEFAULTS } from './toc.config.defaults';

// Compile-checked: the English section is a complete section of a pack.
const EN_SECTION: CngxLanguagePack['toc'] = CNGX_TOC_LANGUAGE_EN;
import { withTocAriaLabels, withTocScrollBehavior, withTocSpy, withTocTemplates } from './features';
import { injectTocAriaLabels, injectTocConfig } from './inject-toc-config';
import { provideTocConfig, provideTocConfigAt } from './provide-toc-config';
import type { CngxTocLanguageSection } from '../i18n/toc-language-section';
import type { CngxTocAriaLabels as DeclaredOnce } from './toc.config';

// Compile-checked: the config copy type is the section's partial, declared once.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const DECLARED_ONCE: Equal<DeclaredOnce, Partial<CngxTocLanguageSection>> = true;
void DECLARED_ONCE;

// A sentinel standing in for a real TemplateRef - the config cascade only
// forwards the reference, so identity is all that matters at this layer. The
// actual slot rendering is exercised in toc.component.spec.ts.
const itemTpl = {} as unknown as TemplateRef<CngxTocItemContext>;

// A view-child probe: reads the resolved config from within the host's view,
// where component `viewProviders` are visible (the host instance itself is
// not, mirroring the breadcrumb config spec).
@Directive({ selector: '[cfgProbe]' })
class CfgProbe {
  readonly cfg = injectTocConfig();
  readonly labels = injectTocAriaLabels();
}

const navLabel = () => TestBed.runInInjectionContext(() => injectTocAriaLabels())().nav;

@Component({
  imports: [CfgProbe],
  viewProviders: [provideTocConfigAt(withTocScrollBehavior('auto'))],
  template: `<i cfgProbe></i>`,
})
class AtHost {
  readonly probe = viewChild.required(CfgProbe);
}

describe('CNGX_TOC_CONFIG', () => {
  it('resolves to the EN library defaults with no provider present', () => {
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(navLabel()).toBe('On this page');
    expect(cfg.scrollBehavior).toBe('smooth');
    expect(cfg.spy?.rootMargin).toBe('0px');
    expect(cfg.spy?.threshold).toBe(0.3);
  });

  it('provideTocConfig at root wins over defaults and deep-merges untouched keys', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig(withTocAriaLabels({ nav: 'Auf dieser Seite' }))],
    });
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(navLabel()).toBe('Auf dieser Seite');
    // sibling keys keep the defaults (deep-merge, not replace)
    expect(cfg.scrollBehavior).toBe('smooth');
    expect(cfg.spy?.threshold).toBe(0.3);
  });

  it('withTocScrollBehavior overrides only the scalar', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig(withTocScrollBehavior('auto'))],
    });
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(cfg.scrollBehavior).toBe('auto');
    expect(navLabel()).toBe('On this page');
  });

  it('withTocSpy overrides the spy defaults and deep-merges the untouched key', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig(withTocSpy({ threshold: 0.5 }))],
    });
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(cfg.spy?.threshold).toBe(0.5);
    // rootMargin keeps the default (deep-merge, not replace)
    expect(cfg.spy?.rootMargin).toBe('0px');
    expect(navLabel()).toBe('On this page');
  });

  it('withTocTemplates carries the item template through the cascade', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig(withTocTemplates({ item: itemTpl }))],
    });
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(cfg.templates?.item).toBe(itemTpl);
    // untouched keys survive the merge
    expect(navLabel()).toBe('On this page');
    expect(cfg.scrollBehavior).toBe('smooth');
  });

  it('provideTocConfig() with zero features preserves the CNGX_TOC_DEFAULTS reference', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig()],
    });
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(cfg).toBe(CNGX_TOC_DEFAULTS);
  });

  it('provideTocConfigAt in viewProviders wins over the root and deep-merges the parent value', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig(withTocAriaLabels({ nav: 'Root label' }))],
    });
    const fixture = TestBed.createComponent(AtHost);
    fixture.detectChanges();
    const { cfg, labels } = fixture.componentInstance.probe();

    expect(cfg.scrollBehavior).toBe('auto'); // At override wins
    expect(labels().nav).toBe('Root label'); // inherited from root via skipSelf merge
  });

  it('follows Signal labels and keeps the bundle reference on an equal recompute', () => {
    const lang = signal<'en' | 'de' | 'de-AT'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideTocConfig(
          withTocAriaLabels(
            computed<CngxTocAriaLabels>(() => (lang() === 'en' ? {} : { nav: 'Auf dieser Seite' })),
          ),
        ),
      ],
    });
    const labels = TestBed.runInInjectionContext(() => injectTocAriaLabels());
    expect(labels().nav).toBe('On this page');

    lang.set('de');
    const german = labels();
    expect(german.nav).toBe('Auf dieser Seite');

    lang.set('de-AT');
    expect(labels()).toBe(german);
  });

  it('falls back to the default for a label an override sets to undefined', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig(withTocAriaLabels({ nav: undefined }))],
    });
    expect(navLabel()).toBe('On this page');
  });

  it('carries no copy in the exported defaults; the English section names the landmark', () => {
    expect(CNGX_TOC_DEFAULTS.ariaLabels).toBeUndefined();
    expect(EN_SECTION.nav).toBe('On this page');
  });

  it('reads the toc section of the active pack', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const labels = TestBed.runInInjectionContext(() => injectTocAriaLabels());
    expect(labels().nav).toBe('On this page');
    pack.set({ locale: 'de', toc: { nav: 'Auf dieser Seite' } });
    expect(labels().nav).toBe('Auf dieser Seite');
  });

  it('lets withTocAriaLabels win on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', toc: { nav: 'Auf dieser Seite' } }),
          withDocumentLanguage('off'),
        ),
        provideTocConfig(withTocAriaLabels({ nav: 'Inhalt' })),
      ],
    });
    expect(TestBed.runInInjectionContext(() => injectTocAriaLabels())().nav).toBe('Inhalt');
  });
});
