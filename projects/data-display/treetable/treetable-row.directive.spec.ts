import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxHoverable } from '@cngx/common';
import type { FlatNode } from './models';
import { CngxTreetableRow } from './treetable-row.directive';

const mockNode: FlatNode<{ name: string }> = {
  id: '1',
  value: { name: 'test' },
  depth: 2,
  hasChildren: false,
  parentIds: [],
};

@Component({
  template: `<div cngxTreetableRow [node]="node" [highlight]="highlight"></div>`,
  imports: [CngxTreetableRow],
})
class TestHost {
  node = mockNode;
  highlight = false;
}

describe('CngxTreetableRow', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  it('composes CngxHoverable via hostDirectives', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const hoverable = fixture.debugElement.query(By.directive(CngxHoverable));
    expect(hoverable).toBeTruthy();
  });

  it('sets --cngx-row-depth CSS custom property from node depth', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('div')).nativeElement as HTMLElement;
    expect(el.style.getPropertyValue('--cngx-row-depth')).toBe('2');
  });

  it('does not add highlighted class when highlight=false', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('div')).nativeElement as HTMLElement;
    expect(el.classList.contains('cngx-treetable__row--highlighted')).toBe(false);
  });

  it('adds highlighted class on hover when highlight=true', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.highlight = true;
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('div'));
    el.triggerEventHandler('mouseenter');
    fixture.detectChanges();
    expect(el.nativeElement.classList.contains('cngx-treetable__row--highlighted')).toBe(true);
  });

  it('removes highlighted class after mouseleave', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.highlight = true;
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('div'));
    el.triggerEventHandler('mouseenter');
    fixture.detectChanges();
    el.triggerEventHandler('mouseleave');
    fixture.detectChanges();
    expect(el.nativeElement.classList.contains('cngx-treetable__row--highlighted')).toBe(false);
  });

  it('adds selected class when selected=true', () => {
    @Component({
      template: `<div cngxTreetableRow [node]="node" [selected]="true"></div>`,
      imports: [CngxTreetableRow],
    })
    class SelectedHost {
      node = mockNode;
    }
    TestBed.configureTestingModule({ imports: [SelectedHost] });
    const fixture = TestBed.createComponent(SelectedHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('div')).nativeElement as HTMLElement;
    expect(el.classList.contains('cngx-treetable__row--selected')).toBe(true);
  });
});
