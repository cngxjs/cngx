import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAvatar } from '../avatar/avatar.component';
import { CngxAvatarGroup } from './avatar-group.component';

@Component({
  template: `<cngx-avatar-group [max]="max()" [label]="label()">
    @for (person of people(); track person) {
      <cngx-avatar [initials]="person" />
    }
  </cngx-avatar-group>`,
  imports: [CngxAvatarGroup, CngxAvatar],
})
class Host {
  readonly people = signal(['AK', 'JD', 'MR', 'PL', 'ST']);
  readonly max = signal<number | undefined>(3);
  readonly label = signal('avatars');
}

describe('CngxAvatarGroup', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const groupEl = fixture.debugElement.query(By.directive(CngxAvatarGroup))
      .nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, groupEl };
  }

  function avatarEls(groupEl: HTMLElement): HTMLElement[] {
    return Array.from(groupEl.querySelectorAll<HTMLElement>(':scope > cngx-avatar'));
  }

  function pill(groupEl: HTMLElement): HTMLElement | null {
    return groupEl.querySelector('.cngx-avatar-group__overflow');
  }

  it('shows max avatars and hides the overflow when max < total', () => {
    const { groupEl } = setup();
    const avatars = avatarEls(groupEl);
    expect(avatars.length).toBe(5);
    expect(avatars.slice(0, 3).every((el) => !el.hasAttribute('hidden'))).toBe(true);
    expect(avatars.slice(3).every((el) => el.hasAttribute('hidden'))).toBe(true);
  });

  it('renders a +N pill with the hidden count', () => {
    const { groupEl } = setup();
    expect(pill(groupEl)?.textContent?.trim()).toBe('+2');
  });

  it('summarises total and hidden counts in aria-label', () => {
    const { groupEl } = setup();
    expect(groupEl.getAttribute('aria-label')).toBe('5 avatars, 2 not shown');
  });

  it('renders no pill and hides nothing when max >= total', () => {
    const { fixture, host, groupEl } = setup();
    host.max.set(5);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(pill(groupEl)).toBeNull();
    expect(avatarEls(groupEl).every((el) => !el.hasAttribute('hidden'))).toBe(true);
    expect(groupEl.getAttribute('aria-label')).toBe('5 avatars');
  });

  it('shows every avatar when max is unset', () => {
    const { fixture, host, groupEl } = setup();
    host.max.set(undefined);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(pill(groupEl)).toBeNull();
    expect(avatarEls(groupEl).every((el) => !el.hasAttribute('hidden'))).toBe(true);
  });
});
