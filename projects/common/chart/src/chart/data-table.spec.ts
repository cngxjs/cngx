import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxChartDataTable } from './data-table.component';

@Component({
  standalone: true,
  imports: [CngxChartDataTable],
  template: `
    <cngx-chart-data-table
      [id]="id()"
      [values]="values()"
      [hidden]="hidden()"
    />
  `,
})
class TestHost {
  values = signal<readonly number[]>([5, 10, 15]);
  hidden = signal<boolean>(false);
  id = signal<string>('test-data-table');
}

describe('CngxChartDataTable', () => {
  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    table: HTMLElement;
  } {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('cngx-chart-data-table') as HTMLElement;
    return { fixture, table };
  }

  it('renders one row per value with the index column populated', () => {
    const { table } = setup();
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    expect(rows.length).toBe(3);
    const firstRow = rows[0];
    expect(firstRow.querySelector('th')?.textContent?.trim()).toBe('1');
    expect(firstRow.querySelector('td')?.textContent?.trim()).toBe('5');
  });

  it('binds the [id] input to the host element id', () => {
    const { table, fixture } = setup();
    expect(table.getAttribute('id')).toBe('test-data-table');
    fixture.componentInstance.id.set('renamed-id');
    fixture.detectChanges();
    expect(table.getAttribute('id')).toBe('renamed-id');
  });

  it('toggles aria-hidden between true and false based on [hidden]', () => {
    const { table, fixture } = setup();
    expect(table.getAttribute('aria-hidden')).toBe('false');
    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();
    expect(table.getAttribute('aria-hidden')).toBe('true');
    fixture.componentInstance.hidden.set(false);
    fixture.detectChanges();
    expect(table.getAttribute('aria-hidden')).toBe('false');
  });

  it('renders an empty body when [values] is empty', () => {
    const { fixture, table } = setup();
    fixture.componentInstance.values.set([]);
    fixture.detectChanges();
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    expect(rows.length).toBe(0);
  });

  it('updates rows when [values] changes', () => {
    const { fixture, table } = setup();
    fixture.componentInstance.values.set([1, 2, 3, 4, 5, 6]);
    fixture.detectChanges();
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    expect(rows.length).toBe(6);
  });

  it('allocates a unique default id per standalone instance when [id] is omitted', () => {
    @Component({
      standalone: true,
      imports: [CngxChartDataTable],
      template: `
        <cngx-chart-data-table data-testid="a" [values]="[1]" [hidden]="false" />
        <cngx-chart-data-table data-testid="b" [values]="[1]" [hidden]="false" />
      `,
    })
    class MultiHost {}

    TestBed.configureTestingModule({ imports: [MultiHost] });
    const fixture = TestBed.createComponent(MultiHost);
    fixture.detectChanges();
    const a = fixture.nativeElement.querySelector('[data-testid="a"]') as HTMLElement;
    const b = fixture.nativeElement.querySelector('[data-testid="b"]') as HTMLElement;
    const idA = a.getAttribute('id') ?? '';
    const idB = b.getAttribute('id') ?? '';
    expect(idA).not.toBe('');
    expect(idB).not.toBe('');
    expect(idA).not.toBe(idB);
  });
});
