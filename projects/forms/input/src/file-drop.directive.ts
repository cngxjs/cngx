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

/**
 * Describes a file that was rejected during drop/browse validation.
 */
export interface FileRejection {
  /** The rejected file. */
  readonly file: File;
  /** Why the file was rejected: MIME type mismatch (`'type'`) or exceeds `maxSize` (`'size'`). */
  readonly reason: 'type' | 'size';
}

/**
 * Headless drag-and-drop file behavior on any element.
 *
 * Handles `dragenter`/`dragover`/`dragleave`/`drop` events, validates
 * files against `accept` and `maxSize`, and provides a `browse()` method
 * for programmatic file picker access.
 *
 * @example
 * ```html
 * <div cngxFileDrop [accept]="['image/*']" [maxSize]="5_000_000"
 *      #drop="cngxFileDrop" (filesChange)="upload($event)">
 *   @if (drop.dragging()) {
 *     <p>Drop files here</p>
 *   } @else {
 *     <p>Drag files or <button (click)="drop.browse()">browse</button></p>
 *   }
 * </div>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxFileDrop]',
  standalone: true,
  exportAs: 'cngxFileDrop',
  host: {
    class: 'cngx-file-drop',
    '(dragenter)': 'handleDragEnter($event)',
    '(dragover)': 'handleDragOver($event)',
    '(dragleave)': 'handleDragLeave($event)',
    '(drop)': 'handleDrop($event)',
    '[class.cngx-file-drop--dragging]': 'dragging()',
    '[class.cngx-file-drop--has-files]': 'files().length > 0',
    '[class.cngx-file-drop--uploading]': 'uploading()',
    '[attr.aria-busy]': 'uploading() || null',
    '[attr.aria-dropeffect]': '"copy"',
  },
})
export class CngxFileDrop {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Accepted MIME types (e.g. `'image/*'`, `'.pdf'`). Empty = all. */
  readonly accept = input<string[]>([]);

  /** Maximum file size in bytes. `undefined` = no limit. */
  readonly maxSize = input<number | undefined>(undefined);

  /** Allow multiple files. */
  readonly multiple = input<boolean>(false);

  /**
   * Bind an upload async state — shows busy/error/progress during upload.
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

  // ── Internal state ──────────────────────────────────────────────────

  private readonly draggingState = signal(false);
  private readonly filesState = signal<File[]>([]);
  private readonly rejectedState = signal<FileRejection[]>([]);
  private dragCounter = 0;
  private fileInput: HTMLInputElement | null = null;

  // ── Public signals ──────────────────────────────────────────────────

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

  // ── Public methods ──────────────────────────────────────────────────

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

  // ── Drag event handlers ─────────────────────────────────────────────

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

  // ── File processing ─────────────────────────────────────────────────

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

    this.filesState.set(valid);
    this.rejectedState.set(rejected);

    if (valid.length > 0) {
      this.filesChange.emit(valid);
    }
    if (rejected.length > 0) {
      this.rejectedChange.emit(rejected);
    }
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
    const max = this.maxSize();
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
