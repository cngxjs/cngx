# Speak: Text-to-Speech

Headless text-to-speech directive using the browser's SpeechSynthesis API.

## Import

```typescript
import { CngxSpeak } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { CngxSpeak } from '@cngx/common/interactive';

@Component({
  selector: 'app-article',
  template: `
    <article>
      <h1>{{ title }}</h1>
      <p [cngxSpeak]="content" #tts="cngxSpeak">{{ content }}</p>

      <button (click)="tts.toggle()">
        {{ tts.speaking() ? 'Stop reading' : 'Read aloud' }}
      </button>
    </article>
  `,
  imports: [CngxSpeak],
})
export class ArticleComponent {
  readonly title = 'Accessible Content';
  readonly content = 'Read this aloud...';
}
```

## Accessibility

CngxSpeak provides cognitive accessibility (dyslexia support, reading assistance):

- **ARIA roles:** None (behavioral directive, consumer renders button/control)
- **Keyboard interaction:**
  - Consumer provides button/control for keyboard interaction
  - `Enter`: Start/stop reading (if consumer implements)
  - `Space`: Start/stop reading (if consumer implements)
- **Screen reader:**
  - Announce the read-aloud feature via button label
  - e.g., "Read aloud" button is announced
  - The directive itself provides no ARIA
- **Focus management:**
  - No focus changes
  - Consumer controls focus

**Important:** This is a cognitive accessibility feature, not a screen reader replacement. SpeechSynthesis is supplementary to, not a substitute for, proper semantic HTML and ARIA.

## Composition

CngxSpeak is a headless atom - the consumer owns the UI:

- **Host directives:** None
- **Combines with:** Any element needing read-aloud capability (articles, docs, notifications)
- **Provides:** Text-to-speech state signals and control methods

### Example: Composition Pattern

```typescript
// Directive provides the speech logic
// Consumer provides the button and any visual feedback
<p [cngxSpeak]="content" #tts="cngxSpeak">
  {{ content }}
  <button (click)="tts.toggle()" aria-label="Toggle read aloud">
    {{ tts.speaking() ? '⏸️ Stop' : '▶️ Read' }}
  </button>
</p>

// More complex: with rate control
<div>
  <textarea [cngxSpeak]="text" #tts="cngxSpeak"></textarea>

  <div class="controls">
    <button (click)="tts.speak(text)" [disabled]="tts.speaking()">
      Play
    </button>
    <button (click)="tts.cancel()" [disabled]="!tts.speaking()">
      Stop
    </button>
    <input type="range" min="0.5" max="2" step="0.1"
           [value]="rate()" (change)="rate.set($event.target.value)" />
  </div>
</div>
```

## Styling

CngxSpeak has no styling - it's purely behavioral. Use the `speaking()` signal for visual feedback:

```scss
button {
  &.speaking {
    background: var(--color-active);
    color: white;
  }
}
```

## Examples

### Article with Read Aloud

```typescript
@Component({
  selector: 'app-article',
  template: `
    <article>
      <h1>{{ article.title }}</h1>

      <div [cngxSpeak]="articleText()" #tts="cngxSpeak" class="content">
        {{ article.body }}
      </div>

      <button (click)="tts.toggle()" class="speak-btn"
              [class.speaking]="tts.speaking()"
              [attr.aria-pressed]="tts.speaking()"
              aria-label="Toggle read aloud">
        @if (tts.speaking()) {
          ⏸️ Stop reading
        } @else {
          ▶️ Read aloud
        }
      </button>
    </article>
  `,
  imports: [CngxSpeak],
  styles: [`
    .speak-btn {
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .speak-btn.speaking {
      background: var(--color-primary);
      color: white;
    }
  `],
})
export class ArticleComponent {
  @Input() article: Article | null = null;

  readonly articleText = computed(() =>
    this.article
      ? `${this.article.title}. ${this.article.body}`
      : ''
  );
}
```

### Accessibility-First: Article with Language Selection

```typescript
@Component({
  selector: 'app-multilingual-article',
  template: `
    <article>
      <h1>{{ article.title }}</h1>

      <div [cngxSpeak]="content()" [lang]="selectedLang()" #tts="cngxSpeak">
        {{ article.body }}
      </div>

      <div class="controls">
        <select [value]="selectedLang()" (change)="selectedLang.set($event.target.value)"
                aria-label="Select language for reading">
          <option value="">Default ({{ browserLanguage }})</option>
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="de-DE">Deutsch</option>
          <option value="fr-FR">Français</option>
          <option value="es-ES">Español</option>
        </select>

        <button (click)="tts.toggle()" class="btn"
                [attr.aria-pressed]="tts.speaking()">
          @if (tts.speaking()) {
            ⏸️ Stop reading
          } @else {
            ▶️ Read aloud
          }
        </button>
      </div>
    </article>
  `,
  imports: [CngxSpeak],
})
export class MultilingualArticleComponent {
  @Input() article: Article | null = null;

  readonly selectedLang = signal('');
  readonly browserLanguage = navigator.language;

  readonly content = computed(() =>
    this.article ? `${this.article.title}. ${this.article.body}` : ''
  );
}
```

### Notification with Auto-Read

```typescript
@Component({
  selector: 'app-alert',
  template: `
    <div role="alert" class="alert">
      <p [cngxSpeak]="message()" #tts="cngxSpeak">
        {{ message() }}
      </p>
      <button (click)="tts.cancel()" *ngIf="tts.speaking()">
        Stop reading
      </button>
    </div>
  `,
  imports: [CngxSpeak],
})
export class AlertComponent {
  @Input() message = signal('Alert message');
  @Input() autoRead = signal(true);

  // Auto-speak when message changes (if enabled)
  // Directive handles this via [enabled] input
}
```

### Text Editor with Read-Back

```typescript
@Component({
  selector: 'app-text-editor',
  template: `
    <div class="editor">
      <textarea [value]="content()" (input)="content.set($event.target.value)"
                [cngxSpeak]="content()" #tts="cngxSpeak"
                placeholder="Type or paste text..."></textarea>

      <div class="controls">
        <button (click)="tts.speak(content())" [disabled]="!content() || tts.speaking()">
          Play
        </button>
        <button (click)="tts.cancel()" [disabled]="!tts.speaking()">
          Stop
        </button>

        <label>Speed:
          <input type="range" min="0.5" max="2" step="0.1" [value]="rate()"
                 (change)="rate.set($event.target.value)" />
          {{ rate().toFixed(1) }}x
        </label>

        <label>Pitch:
          <input type="range" min="0.5" max="2" step="0.1" [value]="pitch()"
                 (change)="pitch.set($event.target.value)" />
        </label>
      </div>

      @if (!tts.supported) {
        <p class="warning">Text-to-speech is not supported in your browser.</p>
      }
    </div>
  `,
  imports: [CngxSpeak],
  styles: [`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    textarea {
      min-height: 300px;
      padding: 12px;
      font-family: monospace;
    }

    .controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    label {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    input[type="range"] {
      width: 100px;
    }

    .warning {
      color: var(--color-warning);
    }
  `],
})
export class TextEditorComponent {
  readonly content = signal('');
  readonly rate = signal(1);
  readonly pitch = signal(1);
}
```

### Dyslexia-Friendly Reading Mode

```typescript
@Component({
  selector: 'app-dyslexia-friendly',
  template: `
    <article class="content" [cngxSpeak]="fullText()" #tts="cngxSpeak">
      <h1>{{ title() }}</h1>

      <div class="text-with-audio">
        <p>{{ body() }}</p>

        <aside class="reading-controls">
          <p>Difficulty reading? Try:</p>
          <button (click)="toggleHighlight()" [class.active]="highlightWords()">
            Highlight words
          </button>
          <button (click)="tts.toggle()" class="speak-btn"
                  [class.speaking]="tts.speaking()">
            @if (tts.speaking()) {
              ⏸️ Stop reading
            } @else {
              ▶️ Read aloud
            }
          </button>

          <label>Reading speed:
            <input type="range" min="0.5" max="1.5" step="0.1"
                   [value]="rate()"
                   (change)="rate.set($event.target.value)"
                   aria-label="Adjust reading speed" />
          </label>
        </aside>
      </div>
    </article>
  `,
  imports: [CngxSpeak],
  styles: [`
    .text-with-audio {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
    }

    .reading-controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: var(--color-surface);
      border-radius: 8px;
    }

    .speak-btn.speaking {
      background: var(--color-primary);
      color: white;
    }

    @media (max-width: 768px) {
      .text-with-audio {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DyslexiaFriendlyComponent {
  readonly title = signal('Article Title');
  readonly body = signal('Article content...');
  readonly rate = signal(1);
  readonly highlightWords = signal(false);

  readonly fullText = computed(() => `${this.title()}. ${this.body()}`);

  toggleHighlight() {
    this.highlightWords.update(v => !v);
  }
}
```

### Suppress Auto-Speak for Dynamic Content

```typescript
// Only speak when explicitly toggled, not on every input change
<div [cngxSpeak]="liveUpdates()" [enabled]="false" #tts="cngxSpeak">
  {{ liveUpdates() }}
  <button (click)="tts.speak(liveUpdates())">
    Read current value
  </button>
</div>
```

## See Also

- [API on compodocx](https://cngxjs.github.io/cngx/)
- [SpeechSynthesis API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [Cognitive Accessibility - WebAIM](https://webaim.org/articles/cognitive/)
- Demo: `examples/stories/common/speak-demo/`
- Tests: `projects/common/interactive/speak/speak.directive.spec.ts`
