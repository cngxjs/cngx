:host {
  --ink: var(--cngx-color-text, oklch(0.2 0.01 280));
  --paper: var(--cngx-color-surface, oklch(0.99 0.003 280));
  --muted: var(--cngx-color-text-muted, oklch(0.5 0.02 280));
  --accent: var(--cngx-color-primary, oklch(0.66 0.19 50));
  --accent-2: var(--cngx-color-accent, oklch(from var(--accent) l c calc(h - 70)));
  --brand: var(--cngx-gradient-brand, linear-gradient(100deg, var(--accent), var(--accent-2)));
  --hairline: color-mix(in oklab, var(--ink) 14%, transparent);
  --raised: color-mix(in oklab, var(--paper) 94%, var(--ink) 6%);

  display: block;
  min-block-size: 100dvh;
  color: var(--ink);
  background: var(--paper);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
}

.shell {
  position: relative;
}

/* Hero */
.hero {
  display: grid;
  justify-items: center;
  max-inline-size: 52rem;
  margin-inline: auto;
  padding: clamp(3.5rem, 10vw, 7rem) clamp(1rem, 4vw, 2rem) clamp(3rem, 8vw, 5rem);
  text-align: center;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 clamp(1.5rem, 4vw, 2.25rem);
  padding: 0.4rem 1rem;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: color-mix(in oklab, var(--paper) 70%, transparent);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent);
}

.pill__dot {
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: 50%;
  background: var(--cngx-color-success, oklch(0.68 0.17 150));
}

.hero__name {
  background-image: var(--brand);
  background-repeat: no-repeat;
  background-size: 100% 0.14em;
  background-position: 0 92%;
  padding-block-end: 0.04em;
}

.hero__lead {
  margin: clamp(1.25rem, 3vw, 1.75rem) 0 0;
  max-inline-size: 38rem;
  color: var(--muted);
  font-size: clamp(1.0625rem, 1.8vw, 1.1875rem);
}

.hero__lead strong {
  color: var(--ink);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.625rem;
  margin: 1.75rem 0 0;
  padding: 0;
  list-style: none;
}

.chips li {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--raised);
  font-size: 0.875rem;
  font-weight: 500;
}

.chips svg {
  inline-size: 1rem;
  block-size: 1rem;
  color: var(--accent);
}

.hero__cta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-block-start: clamp(2rem, 5vw, 2.75rem);
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-block-size: 3.5rem;
  padding: 0 1.875rem;
  border: 1.5px solid transparent;
  border-radius: 999px;
  font: inherit;
  font-size: 1.0625rem;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform var(--cngx-duration-fast, 120ms) var(--cngx-easing-standard, ease),
    background-color var(--cngx-duration-fast, 120ms) var(--cngx-easing-standard, ease);
}

.cta--solid {
  background: var(--ink);
  color: var(--paper);
}

.cta--solid:hover {
  transform: translateY(-1px);
}

.cta--solid span {
  transition: transform var(--cngx-duration-fast, 120ms) var(--cngx-easing-standard, ease);
}

.cta--solid:hover span {
  transform: translateX(3px);
}

.cta--ghost {
  border-color: color-mix(in oklab, var(--ink) 30%, transparent);
  background: transparent;
  color: var(--ink);
}

.cta--ghost:hover {
  background: var(--raised);
}

.cta--small {
  min-block-size: 2.5rem;
  padding: 0 1.125rem;
  font-size: 0.9375rem;
}

.cta:focus-visible,
a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* Try section */
.try {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: 0 clamp(1rem, 4vw, 2rem) clamp(3rem, 8vw, 5rem);
}

.try__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: 1.25rem;
  align-items: start;
}

.card {
  --cngx-card-radius: 1rem;
  --cngx-card-border: 1px solid var(--hairline);
  --cngx-card-bg: color-mix(in oklab, var(--paper) 88%, transparent);
}

.card__body {
  display: grid;
  gap: 0.75rem;
}

.card__kicker {
  margin: 0;
  color: var(--accent);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.card__text {
  margin: 0;
  color: var(--muted);
  font-size: 0.9375rem;
}

.card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hero__lead em {
  color: var(--ink);
  font-style: italic;
}

@media (prefers-reduced-motion: reduce) {
  .cta,
  .cta--solid span {
    transition: none;
  }

  .cta--solid:hover,
  .cta--solid:hover span {
    transform: none;
  }
}
