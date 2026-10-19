body {
  margin: 0;
}

{{selector}} > .shell > main > .hero > h1 {
  margin: 0;
  font-size: clamp(2.5rem, 6.5vw, 4.25rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.035em;
  overflow-wrap: anywhere;
}

{{selector}} > .shell > main > .try > h2 {
  margin: 0 0 1.5rem;
  text-align: center;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.025em;
}

{{selector}} > .shell > main > .try .card__body > h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 750;
  letter-spacing: -0.015em;
}

{{selector}} > .shell > .top {
  border-block-end: 1px solid var(--hairline);
}

{{selector}} > .shell > .top > .top__inner,
{{selector}} > .shell > .foot > .foot__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: 0.875rem clamp(1rem, 4vw, 2rem);
}

{{selector}} > .shell > .top .brand,
{{selector}} > .shell > .foot .brand {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  color: inherit;
  text-decoration: none;
}

{{selector}} > .shell > .top .brand__mark,
{{selector}} > .shell > .foot .brand__mark {
  inline-size: 2rem;
  block-size: 2rem;
}

{{selector}} > .shell > .top .brand__name,
{{selector}} > .shell > .foot .brand__name {
  font-weight: 800;
  font-size: 1.125rem;
  letter-spacing: -0.03em;
}

{{selector}} > .shell > .top .top__nav {
  display: flex;
  gap: clamp(1rem, 3vw, 2.25rem);
  font-weight: 600;
}

{{selector}} > .shell > .top .top__nav a {
  color: inherit;
  text-decoration: none;
}

{{selector}} > .shell > .top .top__nav a:hover {
  color: var(--accent);
}

{{selector}} > .shell > .top .top__icons,
{{selector}} > .shell > .foot .top__icons {
  display: flex;
  gap: 0.5rem;
}

{{selector}} > .shell > .top .icon-btn,
{{selector}} > .shell > .foot .icon-btn {
  display: grid;
  place-items: center;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  border: 1px solid var(--hairline);
  border-radius: 0.625rem;
  color: inherit;
}

{{selector}} > .shell > .top .icon-btn:hover,
{{selector}} > .shell > .foot .icon-btn:hover {
  border-color: color-mix(in oklab, var(--accent) 60%, transparent);
  color: var(--accent);
}

{{selector}} > .shell > .top .icon-btn svg,
{{selector}} > .shell > .foot .icon-btn svg {
  inline-size: 1.125rem;
  block-size: 1.125rem;
}

{{selector}} > .shell > .foot .foot__names {
  display: grid;
  line-height: 1.2;
  text-align: start;
}

{{selector}} > .shell > .foot .foot__full {
  font-size: 0.8125rem;
}

{{selector}} > .shell > .foot {
  border-block-start: 1px solid var(--hairline);
  color: var(--muted);
  font-size: 0.875rem;
}

{{selector}} > .shell > .foot p {
  margin: 0;
  flex: 1 1 20rem;
  text-align: center;
}

{{selector}} > .shell > .foot code {
  padding: 0.1em 0.35em;
  border-radius: 0.25rem;
  background: var(--raised);
  font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.875em;
}

@media (max-width: 40rem) {
  {{selector}} > .shell > .top .top__nav {
    display: none;
  }
}
