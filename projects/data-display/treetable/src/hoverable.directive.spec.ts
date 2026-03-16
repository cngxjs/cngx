import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxHoverable } from './hoverable.directive';

@Component({
  template: '<div cngxHoverable></div>',
  imports: [CngxHoverable],
})
class TestHost {}

describe('CngxHoverable', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  it('starts with hovered=false', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxHoverable))
      .injector.get(CngxHoverable);
    expect(dir.hovered()).toBe(false);
  });

  it('sets hovered=true on mouseenter', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('div'));
    const dir = el.injector.get(CngxHoverable);
    el.triggerEventHandler('mouseenter');
    expect(dir.hovered()).toBe(true);
  });

  it('sets hovered=false on mouseleave', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('div'));
    const dir = el.injector.get(CngxHoverable);
    el.triggerEventHandler('mouseenter');
    el.triggerEventHandler('mouseleave');
    expect(dir.hovered()).toBe(false);
  });
});
