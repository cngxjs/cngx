{{#feedback}}
<cngx-banner-outlet />
{{/feedback}}
<div class="shell">
  <header class="top">
    <div class="top__inner">
      <a class="brand" href="https://cngxjs.github.io/cngx/" target="_blank" rel="noopener" aria-label="cngx documentation">
        {{mark}}
        <span class="brand__name">cngx</span>
      </a>
      <nav class="top__nav" aria-label="cngx">
        <a href="https://cngxjs.github.io/cngx/" target="_blank" rel="noopener">Docs</a>
        <a href="https://cngxjs.github.io/cngx/examples/" target="_blank" rel="noopener">Examples</a>
{{#try}}
        <a href="#try">Try it</a>
{{/try}}
      </nav>
      <div class="top__icons">
{{icons}}
      </div>
    </div>
  </header>

  <main>
    <section class="hero" aria-labelledby="hero-title">
      <p class="pill"><span class="pill__dot" aria-hidden="true"></span>cngx is installed</p>
      <h1 id="hero-title">Hello, <span class="hero__name">{{ title() }}</span>.</h1>
      <p class="hero__lead">
        Your app now runs on <strong>cngx</strong>, spoken <em>composable</em>: signal-native components
        with a focus on <strong>UX</strong>, <strong>DX</strong> and <strong>a11y</strong>. This page shows
        what came with the setup.
      </p>
{{#chips}}
      <ul class="chips" aria-label="Installed">
{{#theme}}
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>Theme</li>
{{/theme}}
{{#a11y}}
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2" fill="currentColor"/><path d="M5 9h14M12 9v12M8 21l4-7 4 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Accessibility</li>
{{/a11y}}
{{#feedback}}
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Feedback</li>
{{/feedback}}
      </ul>
{{/chips}}
      <div class="hero__cta">
{{#feedback}}
        <button type="button" class="cta cta--solid" (click)="showToast()">Show a toast <span aria-hidden="true">&#8594;</span></button>
        <a class="cta cta--ghost" href="https://cngxjs.github.io/cngx/" target="_blank" rel="noopener">Read the docs</a>
{{/feedback}}
{{#noFeedback}}
        <a class="cta cta--solid" href="https://cngxjs.github.io/cngx/" target="_blank" rel="noopener">Read the docs</a>
{{/noFeedback}}
      </div>
    </section>
{{#try}}

    <section id="try" class="try" aria-labelledby="try-title">
      <h2 id="try-title">Try what you just installed</h2>
      <div class="try__grid">
{{#feedback}}
        <cngx-card class="card">
          <div cngxCardBody class="card__body">
            <p class="card__kicker">Feedback</p>
            <h3>Toasts, banners, alerts</h3>
            <p class="card__text">Each one lands in its own place: the toast bottom right, the banner on top, the alert right below.</p>
            <div class="card__actions">
              <button type="button" class="cta cta--small cta--solid" (click)="showToast()">Toast</button>
              <button type="button" class="cta cta--small cta--ghost" (click)="showBanner()">Banner</button>
              <button type="button" class="cta cta--small cta--ghost" (click)="showAlert()">Alert</button>
            </div>
            <cngx-alert-stack scope="starter" />
          </div>
        </cngx-card>
{{/feedback}}
{{#language}}
        <cngx-card class="card">
          <div cngxCardBody class="card__body">
            <p class="card__kicker">Language</p>
            <h3>English or German</h3>
            <p class="card__text">Every cngx string follows the language pack, switched at runtime.</p>
            <cngx-button-toggle-group label="Language" [value]="language()" (valueChange)="setLanguage($event)">
              <button cngxButtonToggle value="en">English</button>
              <button cngxButtonToggle value="de" lang="de">Deutsch</button>
            </cngx-button-toggle-group>
          </div>
        </cngx-card>
{{/language}}
{{#a11y}}
        <cngx-a11y-panel class="card" />
{{/a11y}}
      </div>
    </section>
{{/try}}
{{#routing}}

    <router-outlet />
{{/routing}}
  </main>

  <footer class="foot">
    <div class="foot__inner">
      <span class="brand">{{mark}}<span class="foot__names"><span class="brand__name">cngx</span><span class="foot__full">Composable Angular Experience</span></span></span>
      <p>This page lives in <code>{{templatePath}}</code>. Something off? Run <code>npx &#64;cngx/doctor</code>.</p>
      <div class="top__icons">
{{icons}}
      </div>
    </div>
  </footer>
</div>
{{#feedback}}
<cngx-toast-outlet />
{{/feedback}}
