import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  signal,
  type Signal,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { CNGX_INPUT_CONFIG, DEFAULT_INPUT_ARIA_LABELS } from './input-config';

/**
 * Describes a file that was rejected during drop/browse validation.
 *
 * @category forms/input
 */
export interface FileRejection {
  /** The rejected file. */
  readonly file: File;
  /**
   * Why the file was rejected: MIME type mismatch (`'type'`), exceeds `maxSize`
   * (`'size'`), or over the `maxFiles` count cap (`'count'`).
   */
  readonly reason: 'type' | 'size' | 'count';
}

/** Identity key for dedup across drops. */
function fileKey(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

/**
 * Headless drag-and-drop file behavior on any element.
 *
 * Handles `dragenter`/`dragover`/`dragleave`/`drop` events, validates
 * files against `accept` and `maxSize`, and provides a `browse()` method
 * for programmatic file picker access.
 *
 * The host element is itself the activation control: click, Enter, or Space
 * open the file picker, so it always carries `role="button"`. This affordance
 * is unconditional by design - there is no passive drop-only mode, and you
 * must not nest interactive controls inside the zone.
 *
 * ```html
 * <div cngxFileDrop [accept]="['image/*']" [maxSize]="5_000_000"
 *      #drop="cngxFileDrop" (filesChange)="upload($event)">
 *   @if (drop.dragging()) {
 *     <p>Drop files here</p>
 *   } @else {
 *     <p>Drag files here, or click / press Enter to browse</p>
 *   }
 * </div>
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/file-drop.directive.ts
 * @since 0.1.0
 * @relatedTo CngxInput, CngxAsyncState, withFileMaxSize
 * <example-url>http://localhost:4200/#/forms/input/file-drop/image-upload</example-url>
 */
@Directive({
  selector: '[cngxFileDrop]',
  standalone: true,
  exportAs: 'cngxFileDrop',
  host: {
    class: 'cngx-file-drop',
    role: 'button',
    '(dragenter)': 'handleDragEnter($event)',
    '(dragover)': 'handleDragOver($event)',
    '(dragleave)': 'handleDragLeave($event)',
    '(drop)': 'handleDrop($event)',
    '(click)': 'handleActivate($event)',
    '(keydown.enter)': 'handleActivate($event)',
    '(keydown.space)': 'handleActivate($event)',
    '[class.cngx-file-drop--dragging]': 'dragging()',
    '[class.cngx-file-drop--has-files]': 'files().length > 0',
    '[class.cngx-file-drop--uploading]': 'uploading()',
    '[attr.aria-busy]': 'uploading() || null',
    '[attr.aria-disabled]': 'uploading() || null',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.tabindex]': 'tabIndex()',
  },
})
export class CngxFileDrop {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly config = inject(CNGX_INPUT_CONFIG);

  /** Accepted MIME types (e.g. `'image/*'`, `'.pdf'`). Empty = all. */
  readonly accept = input<string[]>([]);

  /** Maximum file size in bytes. `undefined` = no limit. Falls back to global config. */
  readonly maxSize = input<number | undefined>(undefined);

  private readonly resolvedMaxSize = computed(() => this.maxSize() ?? this.config.fileMaxSize);

  /** Allow multiple files. */
  readonly multiple = input<boolean>(false);

  /** Maximum number of accepted files. `undefined` = no limit. Falls back to global config. */
  readonly maxFiles = input<number | undefined>(undefined);

  private readonly resolvedMaxFiles = computed(() => this.maxFiles() ?? this.config.fileMaxFiles);

  /**
   * `aria-label` for the drop zone. Falls back to the global config
   * (`ariaLabels.fileDropZone`), then the English default.
   */
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel() ?? this.config.ariaLabels?.fileDropZone ?? DEFAULT_INPUT_ARIA_LABELS.fileDropZone,
  );

  /**
   * Bind an upload async state - shows busy/error/progress during upload.
   * When set, `uploading` derives from `state.isBusy()` and `uploadProgress`
   * from `state.progress()`. Drop/browse is disabled while uploading.
   */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** `true` when the upload state is busy. */
  readonly uploading = computed(() => this.state()?.isBusy() ?? false);

  /** Upload progress 0–100, or `undefined`. */
  readonly uploadProgress = computed(() => this.state()?.progress());

  /** Upload error, or `undefined`. */
  readonly uploadError = computed(() => this.state()?.error());

  /** Keyboard focusability: focusable while idle, removed from tab order while uploading. */
  protected readonly tabIndex = computed(() => (this.uploading() ? -1 : 0));

  private readonly draggingState = signal(false);
  private readonly filesState = signal<File[]>([]);
  private readonly rejectedState = signal<FileRejection[]>([]);
  private dragCounter = 0;
  private fileInput: HTMLInputElement | null = null;

  /** Whether the element is currently being dragged over. */
  readonly dragging: Signal<boolean> = this.draggingState.asReadonly();

  /** The dropped/selected files after validation. */
  readonly files: Signal<readonly File[]> = this.filesState.asReadonly();

  /** Files rejected by `accept`/`maxSize` validation. */
  readonly rejected: Signal<readonly FileRejection[]> = this.rejectedState.asReadonly();

  /** Emitted when valid files are dropped/selected. */
  readonly filesChange = output<File[]>();

  /** Emitted when files are rejected. */
  readonly rejectedChange = output<FileRejection[]>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.fileInput) {
        this.fileInput.remove();
        this.fileInput = null;
      }
    });
  }

  /** Opens the native file picker programmatically. No-op while uploading. */
  browse(): void {
    if (this.uploading()) {
      return;
    }
    this.fileInput ??= this.createFileInput();
    this.fileInput.click();
  }

  /** Clears the current file selection. */
  clear(): void {
    this.filesState.set([]);
    this.rejectedState.set([]);
    if (this.fileInput) {
      this.fileInput.value = '';
    }
  }

  /** @internal Keyboard activation: Enter/Space opens the native file picker. */
  protected handleActivate(event: Event): void {
    event.preventDefault();
    this.browse();
  }

  /** @internal */
  protected handleDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter++;
    this.draggingState.set(true);
  }

  /** @internal */
  protected handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /** @internal */
  protected handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.dragCounter = 0;
      this.draggingState.set(false);
    }
  }

  /** @internal */
  protected handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter = 0;
    this.draggingState.set(false);

    if (this.uploading()) {
      return;
    }

    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      this.processFiles(Array.from(droppedFiles));
    }
  }

  private processFiles(incoming: File[]): void {
    const filesToProcess = this.multiple() ? incoming : incoming.slice(0, 1);

    const valid: File[] = [];
    const rejected: FileRejection[] = [];

    for (const file of filesToProcess) {
      const typeOk = this.matchesAccept(file);
      const sizeOk = this.matchesSize(file);

      if (!typeOk) {
        rejected.push({ file, reason: 'type' });
      } else if (!sizeOk) {
        rejected.push({ file, reason: 'size' });
      } else {
        valid.push(file);
      }
    }

    // Multi-mode accumulates across drops; single mode replaces.
    const accumulate = this.multiple();
    const retainedFiles = accumulate ? this.filesState() : [];
    const retainedRejected = accumulate ? this.rejectedState() : [];

    // Drop files already retained, then cap the rest at maxFiles ('count' overflow).
    const seen = new Set(retainedFiles.map(fileKey));
    const fresh = valid.filter((file) => !seen.has(fileKey(file)));

    const cap = this.resolvedMaxFiles();
    const room = cap == null ? fresh.length : Math.max(0, cap - retainedFiles.length);
    const accepted = fresh.slice(0, room);
    const overflow: FileRejection[] = fresh.slice(room).map((file) => ({ file, reason: 'count' }));

    const nextFiles = [...retainedFiles, ...accepted];
    const nextRejected = this.mergeUnique(
      retainedRejected,
      [...rejected, ...overflow],
      (r) => fileKey(r.file),
    );

    this.filesState.set(nextFiles);
    this.rejectedState.set(nextRejected);

    if (accepted.length > 0) {
      this.filesChange.emit(nextFiles);
    }
    if (rejected.length + overflow.length > 0) {
      this.rejectedChange.emit(nextRejected);
    }
  }

  private mergeUnique<T>(existing: readonly T[], incoming: readonly T[], keyOf: (item: T) => string): T[] {
    const seen = new Set(existing.map(keyOf));
    const merged = [...existing];
    for (const item of incoming) {
      const key = keyOf(item);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
    return merged;
  }

  private matchesAccept(file: File): boolean {
    const acceptList = this.accept();
    if (acceptList.length === 0) {
      return true;
    }

    return acceptList.some((pattern) => {
      if (pattern.startsWith('.')) {
        return file.name.toLowerCase().endsWith(pattern.toLowerCase());
      }
      if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -1);
        return file.type.startsWith(prefix);
      }
      return file.type === pattern;
    });
  }

  private matchesSize(file: File): boolean {
    const max = this.resolvedMaxSize();
    return max == null || file.size <= max;
  }

  private createFileInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';

    if (this.multiple()) {
      input.multiple = true;
    }

    const acceptList = this.accept();
    if (acceptList.length > 0) {
      input.accept = acceptList.join(',');
    }

    input.addEventListener('change', () => {
      if (input.files) {
        this.processFiles(Array.from(input.files));
      }
      input.value = '';
    });

    this.el.nativeElement.appendChild(input);
    return input;
  }
}
