# Navigation System

Composable atoms for sidebars and navigation menus.

## Import

```typescript
import {
  CngxNavGroup,
  CngxNavLink,
  CngxNavLabel,
  CngxNavBadge,
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

## API

### CngxNavGroup

Collapsible navigation accordion group.

#### Inputs

|-|-|-|-|
| cngxNavGroup | — | — | Presence enables nav group (no value required) |
| depth | number | 0 | Nesting depth for indentation |
| cngxDisclosureOpened | boolean \| undefined | undefined | Controlled opened state (CngxDisclosure) |
| controls | string | undefined | ID of the controlled content element (CngxDisclosure) |

#### Outputs

|-|-|-|
| openedChange | boolean | Emitted when opened state changes (CngxDisclosure) |

#### Signals

- `disclosure: CngxDisclosure` — The composed disclosure instance

### CngxNavLink

Navigation link atom.

#### Inputs

|-|-|-|-|
| cngxNavLink | — | — | Presence enables nav link (no value required) |
| active | boolean | false | Whether this link is the currently active route |
| scrollOnActive | boolean | true | Whether to scroll link into view when active |
| depth | number | 0 | Nesting depth for indentation |
| ariaCurrent | string | 'page' | ARIA current value when active: 'page', 'step', 'location', 'true' |

#### Outputs

|-|-|-|
| — | — | — |

#### Signals

None (state managed by parent router or component)

### CngxNavLabel

Non-interactive section header for navigation groups.

#### Inputs

|-|-|-|-|
| cngxNavLabel | — | — | Presence enables nav label (no value required) |
| heading | boolean | false | Whether to apply `role="heading"` (opt-in) |
| level | number | 3 | Heading level (2–6) when heading is true |

#### Outputs

|-|-|-|
| — | — | — |

#### Signals

None

### CngxNavBadge

Inline badge for navigation items.

#### Inputs

|-|-|-|-|
| cngxNavBadge | — | — | Presence enables nav badge (no value required) |
| value | string \| number \| null \| undefined | undefined | Badge value. Hidden when empty string, null, undefined, or 0 |
| variant | 'count' \| 'dot' \| 'status' | 'count' | Visual variant: 'count' (number), 'dot' (presence), 'status' (text) |
| ariaLabel | string \| undefined | undefined | Accessible label. When set, removes aria-hidden and announces to SR |

#### Outputs

|-|-|-|
| — | — | — |

#### Signals

- `isEmpty: Signal<boolean>` — Whether badge is visually hidden

### CngxDisclosure

Generic expand/collapse (disclosure) behavior.

#### Inputs

|-|-|-|-|
| cngxDisclosure | — | — | Presence enables disclosure (no value required) |
| cngxDisclosureOpened | boolean \| undefined | undefined | Controlled opened state. When bound, takes precedence |
| controls | string \| undefined | undefined | ID of the controlled content element |

#### Outputs

|-|-|-|
| openedChange | boolean | Emitted when opened state changes |

#### Methods

- `open(): void` — Opens the disclosure
- `close(): void` — Closes the disclosure
- `toggle(): void` — Toggles between open and closed

#### Signals

- `opened: Signal<boolean>` — Current opened state (computed from input or internal)

## Configuration

### provideNavConfig Function

```typescript
provideNavConfig(...features: NavConfigFeature[]): Provider[]
```

Provides nav system configuration with composable feature functions.

**Features:**
- `withSingleAccordion()` — Only one group open at a time
- `withNavIndent(px: number)` — Indentation per depth level (default: 12)
- `withNavAnimation(ms: number)` — Animation duration (default: 150)

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

All nav directives are fully accessible:

- **ARIA roles:**
  - CngxNavLink: `aria-current="page"` when active
  - CngxNavLabel: Optional `role="heading"` (opt-in)
  - CngxNavBadge: `aria-hidden="true"` by default; `aria-label` when meaningful
  - CngxDisclosure: `aria-expanded`, `aria-controls`
- **Keyboard interaction:**
  - CngxNavLink: Standard link/button behavior
  - CngxDisclosure: Enter/Space to toggle, click to toggle
  - Navigation: Tab through links, Arrow keys (if using roving tabindex)
- **Screen reader:**
  - Links announce active state via `aria-current`
  - Badges announce via `aria-label` when provided
  - Disclosure announces expanded state via `aria-expanded`
- **Focus management:**
  - All elements are keyboard focusable
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

## Styling

All nav elements use CSS custom properties for indentation, animation, and spacing:

- `--cngx-nav-depth` (set by directive, integer) — Current nesting depth
- `--cngx-nav-indent` (CSS custom property, default 12px) — Indent per level
- `--cngx-nav-transition` (CSS custom property, default 150ms) — Animation duration

### Basic Stylesheet

```scss
// Indentation
[cngxNavLink],
[cngxNavGroup] {
  padding-left: calc(var(--cngx-nav-depth, 0) * var(--cngx-nav-indent, 12px));
}

// Disclosure animation
#settings-nav {
  transition: max-height var(--cngx-nav-transition, 150ms);
  max-height: 500px;
}

#settings-nav[hidden] {
  max-height: 0;
  overflow: hidden;
}

// Active link styling
[cngxNavLink][aria-current="page"] {
  background: var(--color-primary);
  color: white;
  font-weight: 500;
}

// Badge variants
[cngxNavBadge] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--color-badge);
  color: white;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

[cngxNavBadge--dot] {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  padding: 0;
}
```

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

## Implementation Notes

### Indentation via CSS Custom Properties

The `--cngx-nav-depth` custom property is set by the directives based on the `[depth]` input. Calculate indentation in CSS:

```scss
padding-left: calc(var(--cngx-nav-depth) * var(--cngx-nav-indent, 12px));
```

This allows:
- Per-component overrides via `--cngx-nav-indent`
- Per-level calculation without JavaScript
- Smooth animation on depth changes

### Single Accordion Mode

When `withSingleAccordion()` is provided, opening one group closes all others in the same scope:

```typescript
providers: [provideNavConfig(withSingleAccordion())]
```

Internally uses `CngxNavGroupRegistry` to track registered groups and close siblings.

### Disclosure as Composition Primitive

`CngxDisclosure` is generic — it works for any expand/collapse pattern (FAQs, accordions, popovers, etc.). Not limited to navigation.

## See Also

- [compodoc API documentation](../../../../../../../docs/modules/CngxNavGroup.html)
- Demo: `dev-app/src/app/demos/common/nav-demo/`
- Tests: `projects/common/interactive/src/nav/nav-group.directive.spec.ts`
