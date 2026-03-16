import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="page-main">
      <section class="example-card">
        <h1>Welcome to cngx dev-app</h1>
        <p>
          This application showcases the components and utilities provided by the <strong>@cngx/*</strong> libraries.
        </p>
        <p>Use the navigation to explore individual packages.</p>

        <div class="package-list">
          <h3>Available Packages</h3>
          <ul>
            <li><strong>@cngx/ui</strong> — Core UI components</li>
            <li><strong>@cngx/data-display</strong> — Data tables, lists and trees</li>
            <li><strong>@cngx/forms</strong> — Form controls and validators</li>
            <li><strong>@cngx/utils</strong> — Shared utilities</li>
          </ul>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .package-list {
      margin-top: 2rem;
      background: #f9f9f9;
      padding: 1.5rem;
      border-radius: 8px;
    }
    ul {
      list-style-type: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `]
})
export class HomeComponent {}
