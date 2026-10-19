{{#feedback}}
<cngx-banner-outlet />
{{/feedback}}
<div class="shell">
  <header class="top">
    <div class="top__inner">
      <a class="brand" href="https://cngxjs.github.io/cngx/" target="_blank" rel="noopener" aria-label="cngx documentation">
        <svg class="brand__mark" viewBox="12 12 76 76" aria-hidden="true" focusable="false"><path d="M66.32 32.60A26 26 0 0 0 38.97 25.27" stroke="#ff8a1f" stroke-width="12" fill="none"/><path d="M30.99 29.51A26 26 0 0 0 30.99 70.49" stroke="#f2546b" stroke-width="12" fill="none"/><path d="M38.97 74.73A26 26 0 0 0 66.32 67.40" stroke="#d9429a" stroke-width="12" fill="none"/><circle cx="73" cy="50" r="8" fill="none" stroke="currentColor" stroke-width="6.5"/></svg>
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
        <a class="icon-btn" href="https://github.com/cngxjs/cngx" target="_blank" rel="noopener" aria-label="cngx on GitHub">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
        </a>
        <a class="icon-btn" href="https://www.npmjs.com/package/@cngx/core" target="_blank" rel="noopener" aria-label="@cngx/core on npm">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>
        </a>
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
      <span class="brand"><svg class="brand__mark" viewBox="12 12 76 76" aria-hidden="true" focusable="false"><path d="M66.32 32.60A26 26 0 0 0 38.97 25.27" stroke="#ff8a1f" stroke-width="12" fill="none"/><path d="M30.99 29.51A26 26 0 0 0 30.99 70.49" stroke="#f2546b" stroke-width="12" fill="none"/><path d="M38.97 74.73A26 26 0 0 0 66.32 67.40" stroke="#d9429a" stroke-width="12" fill="none"/><circle cx="73" cy="50" r="8" fill="none" stroke="currentColor" stroke-width="6.5"/></svg><span class="foot__names"><span class="brand__name">cngx</span><span class="foot__full">Composable Angular Experience</span></span></span>
      <p>This page lives in <code>{{templatePath}}</code>. Something off? Run <code>npx &#64;cngx/doctor</code>.</p>
      <div class="top__icons">
        <a class="icon-btn" href="https://github.com/cngxjs/cngx" target="_blank" rel="noopener" aria-label="cngx on GitHub">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
        </a>
        <a class="icon-btn" href="https://www.npmjs.com/package/@cngx/core" target="_blank" rel="noopener" aria-label="@cngx/core on npm">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>
        </a>
      </div>
    </div>
  </footer>
</div>
{{#feedback}}
<cngx-toast-outlet />
{{/feedback}}
