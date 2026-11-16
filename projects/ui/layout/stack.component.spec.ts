import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { CngxStack } from './stack.component';

describe('CngxStack', () => {
  let fixture: ComponentFixture<CngxStack>;
  let component: CngxStack;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CngxStack],
    }).compileComponents();

    fixture = TestBed.createComponent(CngxStack);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('defaults to column direction', () => {
    fixture.detectChanges();
    expect(host.style.flexDirection).toBe('column');
  });

  it('applies row direction when set', () => {
    fixture.componentRef.setInput('direction', 'row');
    fixture.detectChanges();
    expect(host.style.flexDirection).toBe('row');
  });

  it('maps gap "sm" through the override hook onto the density scale', () => {
    fixture.componentRef.setInput('gap', 'sm');
    fixture.detectChanges();
    expect(host.style.gap).toBe('var(--cngx-gap-sm, var(--cngx-space-sm, 8px))');
  });

  it('derives every non-none gap rung from the density scale', () => {
    for (const rung of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      fixture.componentRef.setInput('gap', rung);
      fixture.detectChanges();
      expect(host.style.gap).toContain(`var(--cngx-space-${rung},`);
    }
  });

  it('maps gap "none" to zero', () => {
    fixture.componentRef.setInput('gap', 'none');
    fixture.detectChanges();
    expect(['0', '0px']).toContain(host.style.gap);
  });

  it('maps every align value to a valid align-items keyword', () => {
    const expected = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
    for (const [align, value] of Object.entries(expected)) {
      fixture.componentRef.setInput('align', align);
      fixture.detectChanges();
      expect(host.style.alignItems).toBe(value);
    }
  });

  it('drops a static align attribute so it cannot centre the text', () => {
    @Component({
      imports: [CngxStack],
      template: '<cngx-stack align="center">Text</cngx-stack>',
    })
    class StaticAlignHost {}

    const hostFixture = TestBed.createComponent(StaticAlignHost);
    hostFixture.detectChanges();
    const stack = (hostFixture.nativeElement as HTMLElement).querySelector(
      'cngx-stack',
    ) as HTMLElement;
    expect(stack.hasAttribute('align')).toBe(false);
    expect(stack.style.alignItems).toBe('center');
  });
});
