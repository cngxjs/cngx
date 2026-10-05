import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAvatar } from '../avatar/avatar.component';
import { CngxAvatarGroup } from '../avatar-group/avatar-group.component';
import { CngxChip } from '../chip/chip.component';
import { CngxSegmentedProgress } from '../segmented-progress/segmented-progress.component';
import {
  CNGX_DISPLAY_I18N,
  injectDisplayI18n,
  provideDisplayI18n,
  withDisplayI18nLabels,
  type CngxDisplayI18n,
} from './display-i18n';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { stripBidiIsolates } from '@cngx/testing';

@Component({
  template: `
    <cngx-avatar-group [max]="2">
      <cngx-avatar initials="A" />
      <cngx-avatar initials="B" />
      <cngx-avatar initials="C" />
    </cngx-avatar-group>
    <cngx-segmented-progress [value]="2" [total]="5" />
    <cngx-chip [removable]="true">Red</cngx-chip>
  `,
  imports: [CngxAvatar, CngxAvatarGroup, CngxSegmentedProgress, CngxChip],
})
class Host {}

@Component({
  template: `
    <cngx-avatar-group [max]="2" [label]="noun()">
      <cngx-avatar initials="A" />
      <cngx-avatar initials="B" />
      <cngx-avatar initials="C" />
    </cngx-avatar-group>
  `,
  imports: [CngxAvatar, CngxAvatarGroup],
})
class BoundNounHost {
  readonly noun = signal('people');
}

function render<T>(cmp: Type<T>) {
  const fixture = TestBed.createComponent(cmp);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    group: root.querySelector('cngx-avatar-group'),
    progress: root.querySelector('cngx-segmented-progress'),
    chipRemove: root.querySelector('cngx-chip button'),
  };
}

describe('CNGX_DISPLAY_I18N', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('ships the English copy without a provider', () => {
    const bundle = TestBed.inject(CNGX_DISPLAY_I18N)();
    expect(bundle.avatarStatus('busy')).toBe('busy');
    expect(bundle.avatarGroupNoun).toBe('avatars');
    expect(stripBidiIsolates(bundle.avatarGroupLabel(5, 2))).toBe('5 avatars, 2 not shown');
    expect(stripBidiIsolates(bundle.avatarGroupLabel(5, 0))).toBe('5 avatars');
    expect(bundle.segmentedProgressValueText(2, 5)).toBe('2 of 5');
    expect(bundle.chipRemove).toBe('Remove');
    expect(bundle.avatarGroupOverflow(3)).toBe('+3');
    expect(bundle.badgeOverflow(99)).toBe('99+');
    expect(stripBidiIsolates(bundle.avatarGroupLabelFor(3, 0, 'people'))).toBe('3 people');
  });

  it('reads the display section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const bundle = TestBed.inject(CNGX_DISPLAY_I18N);
    pack.set({
      locale: 'de',
      display: {
        avatarStatus: {
          online: 'online',
          offline: 'offline',
          busy: 'beschäftigt',
          away: 'abwesend',
        },
        avatarGroupLabel: { one: '{count} Person', other: '{count} Personen' },
        avatarGroupOverflow: '+{count}',
      },
    });
    expect(bundle().avatarStatus('busy')).toBe('beschäftigt');
    expect(bundle().avatarGroupLabel(1, 0)).toBe('1 Person');
    expect(bundle().avatarGroupLabel(1200, 0)).toBe('1.200 Personen');
    expect(bundle().avatarGroupOverflow(1200)).toBe('+1.200');
    expect(bundle().chipRemove).toBe('Remove');
  });

  it('lets provideDisplayI18n override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            display: { chipRemove: 'Entfernen', avatarGroupOverflow: '{count} weitere' },
          }),
          withDocumentLanguage('off'),
        ),
        provideDisplayI18n(withDisplayI18nLabels({ chipRemove: 'Löschen' })),
      ],
    });
    const { group, chipRemove } = render(Host);
    expect(chipRemove?.getAttribute('aria-label')).toBe('Löschen');
    expect(group?.querySelector('.cngx-avatar-group__overflow')?.textContent?.trim()).toBe(
      '1 weitere',
    );
  });

  it('renders the English defaults on the display atoms', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const { group, progress, chipRemove } = render(Host);
    expect(stripBidiIsolates(group?.getAttribute('aria-label'))).toBe('3 avatars, 1 not shown');
    expect(progress?.getAttribute('aria-valuetext')).toBe('2 of 5');
    expect(chipRemove?.getAttribute('aria-label')).toBe('Remove');
  });

  it('seeds the string inputs from a static override and composes a noun-only override', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideDisplayI18n(
          withDisplayI18nLabels({ avatarGroupNoun: 'Profile', chipRemove: 'Entfernen' }),
        ),
      ],
    });
    const { group, chipRemove } = render(Host);
    expect(stripBidiIsolates(group?.getAttribute('aria-label'))).toBe('3 Profile, 1 not shown');
    expect(chipRemove?.getAttribute('aria-label')).toBe('Entfernen');
  });

  it('flips the formatter keys live through a Signal override', () => {
    const overrides = signal<Partial<CngxDisplayI18n>>({});
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideDisplayI18n(withDisplayI18nLabels(overrides))],
    });
    const { fixture, group, progress } = render(Host);
    expect(progress?.getAttribute('aria-valuetext')).toBe('2 of 5');

    overrides.set({
      avatarGroupLabel: (total, hidden) => `${total} Profile, ${hidden} ausgeblendet`,
      segmentedProgressValueText: (now, max) => `${now} von ${max}`,
    });
    fixture.detectChanges();
    expect(group?.getAttribute('aria-label')).toBe('3 Profile, 1 ausgeblendet');
    expect(progress?.getAttribute('aria-valuetext')).toBe('2 von 5');
  });

  it('keeps the English composition for a consumer-bound noun', () => {
    TestBed.configureTestingModule({
      imports: [BoundNounHost],
      providers: [
        provideDisplayI18n(withDisplayI18nLabels({ avatarGroupLabel: () => 'bundle formatter' })),
      ],
    });
    const { group } = render(BoundNounHost);
    expect(stripBidiIsolates(group?.getAttribute('aria-label'))).toBe('3 people, 1 not shown');
  });

  it('shares one Signal across readers under one injector', () => {
    TestBed.configureTestingModule({
      providers: [provideDisplayI18n(withDisplayI18nLabels({ chipRemove: 'x' }))],
    });
    const first = TestBed.runInInjectionContext(() => injectDisplayI18n());
    const second = TestBed.runInInjectionContext(() => injectDisplayI18n());
    expect(first).toBe(second);
  });
});
