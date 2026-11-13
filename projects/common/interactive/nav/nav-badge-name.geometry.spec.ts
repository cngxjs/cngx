/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibleName } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxNavBadge } from './nav-badge.directive';
import { CngxNavLink } from './nav-link.directive';

// Runs in a real Chromium (the `test-geometry` target). The badge host is
// aria-hidden, so its visible count or dot never reaches the link name; the
// ariaLabel is a visually hidden sibling inside the link and joins the name
// from content. Names come from Chromium's own accessibility tree.

@Component({
  selector: 'cngx-nav-badge-name-host',
  standalone: true,
  imports: [CngxNavLink, CngxNavBadge],
  styleUrls: ['../../../core/theming/utilities.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav>
      <a cngxNavLink href="#inbox" class="link-inbox">
        Inbox
        <span cngxNavBadge [value]="12" ariaLabel="12 unread">12</span>
      </a>
      <a cngxNavLink href="#updates" class="link-updates">
        Updates
        <span cngxNavBadge variant="dot" [value]="1" ariaLabel="New updates"></span>
      </a>
      <a cngxNavLink href="#drafts" class="link-drafts">
        Drafts
        <span cngxNavBadge [value]="3">3</span>
      </a>
      <a cngxNavLink href="#archive" class="link-archive">
        Archive
        <span cngxNavBadge [value]="0" ariaLabel="0 unread">0</span>
      </a>
    </nav>
  `,
})
class NavBadgeNameHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): void {
  const fixture = TestBed.createComponent(NavBadgeNameHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
}

// The template's edge whitespace reaches Chromium's raw name; AT trims it.
async function linkName(selector: string): Promise<string | undefined> {
  return (await accessibleName(selector))?.trim();
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxNavBadge accessible name', () => {
  it('adds a count label to the link name', async () => {
    mount();
    expect(await linkName('.link-inbox')).toBe('Inbox 12 unread');
  });

  it('adds a dot label to the link name', async () => {
    mount();
    expect(await linkName('.link-updates')).toBe('Updates New updates');
  });

  it('keeps an unlabelled count out of the link name', async () => {
    mount();
    expect(await linkName('.link-drafts')).toBe('Drafts');
  });

  it('keeps the label of an empty badge out of the link name', async () => {
    mount();
    expect(await linkName('.link-archive')).toBe('Archive');
  });
});
