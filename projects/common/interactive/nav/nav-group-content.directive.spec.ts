import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { CngxNavGroup } from './nav-group.directive';
import { CngxNavGroupContent } from './nav-group-content.directive';

@Component({
  template: `
    <button cngxNavGroup #group="cngxNavGroup" [controls]="'team-nav'" id="team-label">Team</button>
    <div [cngxNavGroupContent]="group">
      <div id="team-nav" role="group" aria-labelledby="team-label">
        <a href="#members">Members</a>
      </div>
    </div>
  `,
  imports: [CngxNavGroup, CngxNavGroupContent],
})
class TestHost {}

describe('CngxNavGroupContent', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const group = fixture.debugElement.query(By.directive(CngxNavGroup)).injector.get(CngxNavGroup);
    const content = fixture.debugElement.query(By.directive(CngxNavGroupContent))
      .nativeElement as HTMLElement;
    const toggle = () => {
      group.disclosure.toggle();
      TestBed.flushEffects();
      fixture.detectChanges();
    };
    return { content, toggle };
  }

  it('exposes its own host and its group head as element, for organisms that place the region', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const contentDe = fixture.debugElement.query(By.directive(CngxNavGroupContent));
    const groupDe = fixture.debugElement.query(By.directive(CngxNavGroup));
    const content = contentDe.injector.get(CngxNavGroupContent);
    expect(content.element).toBe(contentDe.nativeElement);
    expect(content.group().element).toBe(groupDe.nativeElement);
  });

  it('always carries the animated content class', () => {
    const { content } = setup();
    expect(content.classList.contains('cngx-nav-group-content')).toBe(true);
  });

  it('is inert and not open while the group is closed', () => {
    const { content } = setup();
    expect(content.hasAttribute('inert')).toBe(true);
    expect(content.classList.contains('cngx-nav-group-content--open')).toBe(false);
  });

  it('drops inert and adds the open class when the group opens', () => {
    const { content, toggle } = setup();
    toggle();
    expect(content.hasAttribute('inert')).toBe(false);
    expect(content.classList.contains('cngx-nav-group-content--open')).toBe(true);
  });

  it('moves focus to the trigger when the group closes with focus inside', () => {
    const fixture = TestBed.createComponent(TestHost);
    document.body.appendChild(fixture.nativeElement);
    try {
      fixture.detectChanges();
      const groupDe = fixture.debugElement.query(By.directive(CngxNavGroup));
      const group = groupDe.injector.get(CngxNavGroup);
      const trigger = groupDe.nativeElement as HTMLElement;
      const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('a')!;

      group.disclosure.open();
      fixture.detectChanges();
      link.focus();
      expect(document.activeElement).toBe(link);

      group.disclosure.close();
      TestBed.flushEffects();
      fixture.detectChanges();
      expect(document.activeElement).toBe(trigger);
    } finally {
      (fixture.nativeElement as HTMLElement).remove();
    }
  });

  it('leaves focus alone when the group closes with focus elsewhere', () => {
    const fixture = TestBed.createComponent(TestHost);
    document.body.appendChild(fixture.nativeElement);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    try {
      fixture.detectChanges();
      const group = fixture.debugElement
        .query(By.directive(CngxNavGroup))
        .injector.get(CngxNavGroup);
      group.disclosure.open();
      fixture.detectChanges();
      outside.focus();

      group.disclosure.close();
      TestBed.flushEffects();
      fixture.detectChanges();
      expect(document.activeElement).toBe(outside);
    } finally {
      outside.remove();
      (fixture.nativeElement as HTMLElement).remove();
    }
  });

  it('restores inert and removes the open class when the group closes again', () => {
    const { content, toggle } = setup();
    toggle();
    toggle();
    expect(content.hasAttribute('inert')).toBe(true);
    expect(content.classList.contains('cngx-nav-group-content--open')).toBe(false);
  });
});
