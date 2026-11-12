# Navigation System

Composable atoms for sidebars and navigation menus.

## Import

```typescript
import {
  CngxNavGroup,
  CngxNavGroupContent,
  CngxNavLink,
  CngxNavLabel,
  CngxNavBadge,
  CngxNavIcon,
  CngxNavHeader,
  CngxNavFooter,
  CngxNavMark,
  CngxNavName,
  CngxDisclosure,
  provideNavConfig,
  withSingleAccordion,
  withNavIndent,
  withNavAnimation,
  injectNavConfig,
  type NavBadgeVariant,
} from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import {
  CngxNavGroup,
  CngxNavLink,
  CngxNavLabel,
  CngxNavBadge,
  provideNavConfig,
  withSingleAccordion,
} from '@cngx/common/interactive';

@Component({
  selector: 'app-sidebar',
  template: `
    <nav class="sidebar">
      <span cngxNavLabel>@cngx/common</span>

      <button cngxNavGroup [depth]="0" [controls]="'settings-nav'"
              id="settings-label">
        Settings
        <span cngxNavBadge [value]="3">3</span>
      </button>
      @if (settingsGroup.disclosure.opened()) {
        <div id="settings-nav" role="group" [attr.aria-labelledby]="'settings-label'">
          <a cngxNavLink [depth]="1" [active]="route === '/general'">
            General
          </a>
          <a cngxNavLink [depth]="1" [active]="route === '/security'">
            Security
          </a>
        </div>
      }

      <a cngxNavLink [depth]="0" [active]="route === '/dashboard'">
        Dashboard
      </a>
    </nav>
  `,
  imports: [CngxNavGroup, CngxNavLink, CngxNavLabel, CngxNavBadge],
  providers: [provideNavConfig(withSingleAccordion())],
})
export class SidebarComponent {
  readonly route = '';
}
```

## Group content: two paths

A `CngxNavGroup` sits on the trigger. The content is yours to render, in one of two ways:

- **`@if` (no animation):** remove the content while the group is closed, as in the Quick Start. Removed links are neither focusable nor exposed to assistive technology.
- **`[cngxNavGroupContent]` (animated):** keep the content in the DOM and let the height transition run. The wrapper must use `CngxNavGroupContent`: it sets the `.cngx-nav-group-content` / `--open` classes the sidenav stylesheet animates and makes the region `inert` while the group is closed, so collapsed links leave the tab order and the accessibility tree.

```html
<button cngxNavGroup #group="cngxNavGroup" [controls]="'settings-nav'" id="settings-label">
  Settings
</button>
<div [cngxNavGroupContent]="group">
  <div id="settings-nav" role="group" aria-labelledby="settings-label">
    <a cngxNavLink [depth]="1">General</a>
    <a cngxNavLink [depth]="1">Security</a>
  </div>
</div>
```

The grid-rows animation needs exactly one wrapper child inside the directive host.

## Configuration

### provideNavConfig Function

```typescript
provideNavConfig(...features: NavConfigFeature[]): Provider[]
```

Provides nav system configuration with composable feature functions.

**Features:**
- `withSingleAccordion()` - Only one group open at a time
- `withNavIndent(px: number)` - Indentation per depth level (default: 12)
- `withNavAnimation(ms: number)` - Animation duration (default: 150)

**Example:**
```typescript
providers: [
  provideNavConfig(
    withSingleAccordion(),
    withNavIndent(16),
    withNavAnimation(200)
  )
]
```

### injectNavConfig Function

```typescript
injectNavConfig(): Readonly<Required<CngxNavConfig>>
```

Injects resolved nav config with defaults merged in. Must be called in an injection context.

## Accessibility

- **ARIA roles:**
  - CngxNavLink: `aria-current="page"` when active
  - CngxNavLabel: Optional `role="heading"` (opt-in)
  - CngxNavBadge: always `aria-hidden="true"`; `ariaLabel` becomes visually hidden text in the link name
  - CngxDisclosure: `aria-expanded`, `aria-controls`
  - CngxNavGroupContent: `inert` while the group is closed
- **Keyboard interaction:**
  - CngxNavLink: Standard link/button behavior
  - CngxDisclosure: Enter/Space to toggle, click to toggle
  - Navigation: Tab through links, Arrow keys (if using roving tabindex)
- **Screen reader:**
  - Links announce active state via `aria-current`
  - Badges announce their `ariaLabel` as part of the link name ("Inbox 12 unread")
  - Disclosure announces expanded state via `aria-expanded`
- **Focus management:**
  - All elements are keyboard focusable
  - Links inside a collapsed animated group are not (`CngxNavGroupContent` sets `inert`)
  - Active link can auto-scroll into view via `scrollOnActive`

## Composition

Nav directives are orthogonal atoms that compose to build sidebars:

- **Host directives:**
  - CngxNavGroup composes CngxDisclosure as hostDirective
  - CngxNavLink does not depend on CngxNavGroup
- **Combines with:** Router, custom route tracking, disclosure patterns
- **Provides:** Indentation, collapse/expand, active state, badges

### Example: Composition Pattern

```typescript
// Simple sidebar without routing
<nav class="sidebar">
  <span cngxNavLabel>Menu</span>

  <button cngxNavGroup #group="cngxNavGroup" [depth]="0">
    Settings
  </button>
  @if (group.disclosure.opened()) {
    <a cngxNavLink [depth]="1" href="/settings/general">
      General
    </a>
    <a cngxNavLink [depth]="1" href="/settings/security">
      Security
    </a>
  }
</nav>

// With router integration
<nav class="sidebar">
  <a cngxNavLink [active]="router.isActive('/dashboard')" [depth]="0"
     routerLink="/dashboard">
    Dashboard
  </a>

  <button cngxNavGroup [active]="router.isActive('/settings')" #group="cngxNavGroup"
          [depth]="0">
    Settings
  </button>
  @if (group.disclosure.opened()) {
    <a cngxNavLink [active]="router.isActive('/settings/general')" [depth]="1"
       routerLink="/settings/general">
      General
    </a>
  }
</nav>
```

## Icon slot and letter fallback

Put `cngxNavIcon` on the icon inside a row or a group head. `cngx-nav.css` sizes it to `--cngx-nav-icon-size` and places it in the row's icon box, at the same x in every row. The icon may sit inside a wrapper. It is `aria-hidden`, also when it is a `cngx-icon` with a `label`; the row text stays the accessible name.

```html
<a cngxNavLink href="/inbox">
  <cngx-icon cngxNavIcon><mat-icon>inbox</mat-icon></cngx-icon>
  Inbox
</a>
<a cngxNavLink href="/archive">Archive</a>
```

A row without an icon draws its first letter in the same box, as a round filled badge. `CngxNavLink` and `CngxNavGroup` write it to `data-initial` after the first render: the first grapheme of the row text, uppercased with the app locale. Set `data-initial` yourself to pick another letter; the directive never overwrites it. The letter is drawn with `content: attr(data-initial) / ''`, so it never reaches the accessible name. Icon rows and letter rows line up, which is what a collapsed rail needs.

## Header, footer, mark and name

`cngx-nav-header` / `[cngxNavHeader]` and `cngx-nav-footer` / `[cngxNavFooter]` are the top and bottom regions of a nav container. Both are flex rows at the row inset, the header with a bottom border and weight 600, the footer pushed to the bottom with a top border and muted text. Inside them, `[cngxNavMark]` (logo or avatar, `aria-hidden`) fills the icon box at the row icon x, and `[cngxNavName]` sits at the row label x and truncates with an ellipsis.

```html
<nav aria-label="Main">
  <cngx-nav-header>
    <img cngxNavMark src="/logo.svg" alt="" />
    <span cngxNavName>Acme Console</span>
  </cngx-nav-header>
  <a cngxNavLink href="/dashboard">Dashboard</a>
  <cngx-nav-footer>
    <span cngxNavMark class="avatar">JD</span>
    <span cngxNavName>Jane Doe</span>
  </cngx-nav-footer>
</nav>
```

`CngxSidenav` projects these slots above and below its scrolling body; any other container lays them out where it renders them.

## Theming

The nav atoms ship their skin in `cngx-nav.css` (`@cngx/common/theming/components`), which `@cngx/themes/cngx.css` imports. A `<nav>` of `cngxNavLink`, `cngxNavGroup`, `cngxNavLabel` and `cngxNavBadge` renders finished with no stylesheet of your own: one row shape for links and group heads, graded state fills (hover < pressed < active < active+hover), an indicator bar on the active row, a double focus ring, depth indentation, a group chevron and an animated group content. No selector in the file carries a container prefix, so the rows look the same in `cngx-sidenav`, a `cngxSidebar` or a plain `<nav>`.

### Tokens

| Group | Tokens |
|-|-|
| Row | `--cngx-nav-link-padding`, `-font-size`, `-color`, `-inset`, `-radius`, `--cngx-nav-icon-size`, `--cngx-nav-icon-gap`, `--cngx-nav-link-ink`, `--cngx-nav-link-initial-size`, `--cngx-nav-chevron-size` |
| States | `--cngx-nav-link-hover-color`, `-hover-bg`, `-pressed-bg`, `-active-color`, `-active-bg`, `-active-hover-bg`, `-active-font-weight` |
| Indicator | `--cngx-nav-link-active-indicator-color`, `-size`, `-inset` |
| Focus | `--cngx-nav-link-focus-outline-color`, `-inner-color`, `-outline-width`, `-outline-offset` |
| Label, badge | `--cngx-nav-label-color`, `-font-size`, `-padding`, `--cngx-nav-badge-bg`, `-color`, `-font-size`, `-dot-size` |
| Header, footer | `--cngx-nav-header-padding-block`, `-bg`, `-border-color`, `-font-size` and the same four for `--cngx-nav-footer-*` |
| Behaviour | `--cngx-nav-depth` (written by the directive), `--cngx-nav-indent` (12px unless `withNavIndent()` emits one), `--cngx-nav-transition` (`--cngx-duration-base` unless `withNavAnimation()` emits one) |

The compodocx Theming tab of each directive lists defaults, syntax and the foundation token every value derives from.

### Container SETs versus row SETs

Every token is read on the row, and every colour token is SET once at `:root` from the foundation (fills from `--cngx-color-primary` at 6/12/16/22 %, the indicator from `--cngx-color-primary-text`, the focus ring from `--cngx-color-text` and `--cngx-color-surface`, the count badge from `--cngx-color-primary-strong`). The length tokens that follow density (inset, indicator size and inset) are also SET on `[data-density]` and `.cngx-density-*` scopes, so a compact region gets thinner bars.

A container that wants its own look SETs the tokens on its host; the rows inside inherit them. That is what `cngx-sidenav` does for fills, focus ring, inset, padding and the header and footer borders:

```css
.app-sidebar {
  --cngx-nav-link-active-bg: var(--brand-50);
  --cngx-nav-link-active-indicator-color: var(--brand-600);
  --cngx-nav-link-inset: 8px;
}
```

To restyle a single row, SET the token on that row instead (`[cngxNavLink].danger { --cngx-nav-link-color: var(--cngx-color-danger-text); }`). Do not write `background` or `padding` on `.cngx-nav-link` directly: the state ladder and the indicator read the tokens, and a raw property only wins for the rest state.

In forced-colors mode the active row paints `Highlight` with a `HighlightText` bar, and filled badges keep a `CanvasText` ring.

## Examples

### Simple Sidebar with Router

```typescript
@Component({
  selector: 'app-sidebar',
  template: `
    <nav class="sidebar">
      <span cngxNavLabel>Navigation</span>

      <a cngxNavLink routerLink="/dashboard" routerLinkActive
         #dashActive="routerLinkActive" [active]="dashActive.isActive"
         [depth]="0">
        Dashboard
      </a>

      <a cngxNavLink routerLink="/analytics" routerLinkActive
         #analyticsActive="routerLinkActive" [active]="analyticsActive.isActive"
         [depth]="0">
        Analytics
      </a>
    </nav>
  `,
  imports: [CngxNavLink, CngxNavLabel, RouterLink, RouterLinkActive],
  styles: [`
    .sidebar {
      width: 240px;
      border-right: 1px solid var(--color-border);
    }

    [cngxNavLabel] {
      display: block;
      padding: 16px 12px;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--color-muted);
    }

    [cngxNavLink] {
      display: block;
      padding: 12px 16px;
      text-decoration: none;
      color: inherit;
      transition: background 0.2s;
    }

    [cngxNavLink]:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    [cngxNavLink][aria-current] {
      background: var(--color-primary);
      color: white;
    }
  `],
})
export class SidebarComponent {}
```

### Accordion with Badges

```typescript
@Component({
  selector: 'app-nav-accordion',
  template: `
    <nav class="nav">
      <span cngxNavLabel [heading]="true" [level]="2">Settings</span>

      <button cngxNavGroup #general="cngxNavGroup" [depth]="0"
              [controls]="'general-nav'" id="general-label"
              [class.cngx-nav-group--open]="general.disclosure.opened()">
        General
        <span cngxNavBadge [value]="generalNotifications()">
          {{ generalNotifications() }}
        </span>
      </button>
      @if (general.disclosure.opened()) {
        <div id="general-nav" role="group" [attr.aria-labelledby]="'general-label'">
          <a cngxNavLink [depth]="1" [active]="route === '/general/profile'">
            Profile
          </a>
          <a cngxNavLink [depth]="1" [active]="route === '/general/language'">
            Language
          </a>
        </div>
      }

      <button cngxNavGroup #security="cngxNavGroup" [depth]="0"
              [controls]="'security-nav'" id="security-label">
        Security
        <span cngxNavBadge variant="dot" [value]="securityAlerts() > 0 ? 1 : null"
              ariaLabel="Security alerts">
        </span>
      </button>
      @if (security.disclosure.opened()) {
        <div id="security-nav" role="group" [attr.aria-labelledby]="'security-label'">
          <a cngxNavLink [depth]="1" [active]="route === '/security/password'">
            Password
          </a>
          <a cngxNavLink [depth]="1" [active]="route === '/security/2fa'">
            2FA
          </a>
        </div>
      }
    </nav>
  `,
  imports: [CngxNavGroup, CngxNavLink, CngxNavLabel, CngxNavBadge],
  providers: [provideNavConfig(withSingleAccordion())],
  styles: [`
    [cngxNavLabel] {
      display: block;
      padding: 12px 16px;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--color-muted);
    }

    [cngxNavGroup] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 12px 16px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
    }

    [cngxNavGroup]:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    [cngxNavBadge] {
      margin-left: 8px;
    }
  `],
})
export class NavAccordionComponent {
  readonly route = '';
  readonly generalNotifications = signal(3);
  readonly securityAlerts = signal(1);
}
```

The Security dot carries `ariaLabel`, so the group name reads "Security Security alerts". A visible dot without `ariaLabel` warns in development mode [`CNGX1083`](../../../../core-concepts/error-codes/cngx1083.md).

### Hierarchical Sidebar

```typescript
@Component({
  selector: 'app-hierarchical-sidebar',
  template: `
    <nav class="sidebar">
      <span cngxNavLabel>Docs</span>

      <!-- Level 0 -->
      <a cngxNavLink [active]="activeDoc === 'intro'" [depth]="0">
        Introduction
      </a>

      <!-- Level 0 group -->
      <button cngxNavGroup #getting="cngxNavGroup" [depth]="0"
              [controls]="'getting-nav'" id="getting-label">
        Getting Started
      </button>
      @if (getting.disclosure.opened()) {
        <div id="getting-nav" role="group" [attr.aria-labelledby]="'getting-label'">
          <!-- Level 1 -->
          <a cngxNavLink [active]="activeDoc === 'install'" [depth]="1">
            Installation
          </a>
          <a cngxNavLink [active]="activeDoc === 'setup'" [depth]="1">
            Setup
          </a>

          <!-- Level 1 group -->
          <button cngxNavGroup #setup-adv="cngxNavGroup" [depth]="1"
                  [controls]="'setup-adv-nav'" id="setup-adv-label">
            Advanced Setup
          </button>
          @if (setup-adv.disclosure.opened()) {
            <div id="setup-adv-nav" role="group" [attr.aria-labelledby]="'setup-adv-label'">
              <!-- Level 2 -->
              <a cngxNavLink [active]="activeDoc === 'docker'" [depth]="2">
                Docker
              </a>
              <a cngxNavLink [active]="activeDoc === 'kubernetes'" [depth]="2">
                Kubernetes
              </a>
            </div>
          }
        </div>
      }
    </nav>
  `,
  imports: [CngxNavGroup, CngxNavLink, CngxNavLabel],
  providers: [provideNavConfig(withNavIndent(16))],
})
export class HierarchicalSidebarComponent {
  readonly activeDoc = signal('');
}
```

### Generic Disclosure (Non-Nav)

```typescript
// CngxDisclosure can be used standalone for any accordion/collapse pattern
@Component({
  selector: 'app-faq',
  template: `
    <div class="faq">
      @for (item of faqItems; track item.id) {
        <button [cngxDisclosure]="'disclosure-' + item.id"
                [controls]="'content-' + item.id"
                class="faq-question"
                #disclosure="cngxDisclosure">
          {{ item.question }}
        </button>
        @if (disclosure.opened()) {
          <div [id]="'content-' + item.id" class="faq-answer">
            {{ item.answer }}
          </div>
        }
      }
    </div>
  `,
  imports: [CngxDisclosure],
  styles: [`
    .faq-question {
      width: 100%;
      padding: 12px;
      text-align: left;
      background: var(--color-surface);
      border: none;
      cursor: pointer;
    }

    .faq-answer {
      padding: 12px;
      background: rgba(0, 0, 0, 0.02);
    }
  `],
})
export class FAQComponent {
  readonly faqItems = [
    { id: 1, question: 'Q1?', answer: 'A1' },
    { id: 2, question: 'Q2?', answer: 'A2' },
  ];
}
```

## See Also

- [compodocx API documentation](https://cngxjs.github.io/cngx/)
- Demo: `examples/stories/common/nav-demo/`
- Tests: `projects/common/interactive/nav/nav-group.directive.spec.ts`
