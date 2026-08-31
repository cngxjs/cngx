import { describe, it, expect, beforeEach } from 'vitest';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { CngxGrid } from './grid.component';

describe('CngxGrid', () => {
  let fixture: ComponentFixture<CngxGrid>;
  let component: CngxGrid;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CngxGrid],
    }).compileComponents();

    fixture = TestBed.createComponent(CngxGrid);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('generates repeat() template for numeric columns', () => {
    fixture.componentRef.setInput('columns', 3);
    fixture.detectChanges();
    expect(host.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  it('passes through string column definitions', () => {
    fixture.componentRef.setInput('columns', '200px 1fr');
    fixture.detectChanges();
    expect(host.style.gridTemplateColumns).toBe('200px 1fr');
  });

  it('defaults the gap to the override hook backed by the density scale', () => {
    fixture.detectChanges();
    expect(host.style.gap).toBe('var(--cngx-gap-md, var(--cngx-space-md, 16px))');
  });

  it('passes a raw gap value through unchanged', () => {
    fixture.componentRef.setInput('gap', '2rem');
    fixture.detectChanges();
    expect(host.style.gap).toBe('2rem');
  });
});
