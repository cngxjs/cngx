import { describe, it, expect, beforeEach } from 'vitest';
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
});
