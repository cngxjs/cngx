import { Injectable } from '@angular/core';
import type { ApiEntry, ApiInput, ApiMethod, ApiOutput } from './api-types';

interface CompodocEntry {
  name: string;
  selector?: string;
  exportAs?: string;
  description?: string;
  rawdescription?: string;
  inputsClass?: CompodocProp[];
  outputsClass?: CompodocProp[];
  methodsClass?: CompodocMethod[];
}

interface CompodocProp {
  name: string;
  type?: string;
  defaultValue?: string;
  description?: string;
  rawdescription?: string;
  required?: boolean;
}

interface CompodocMethod {
  name: string;
  returnType?: string;
  description?: string;
  rawdescription?: string;
  args?: { name: string; type: string }[];
}

interface CompodocJson {
  directives?: CompodocEntry[];
  components?: CompodocEntry[];
  injectables?: CompodocEntry[];
  classes?: CompodocEntry[];
}

/**
 * Loads compodoc documentation JSON and extracts API entries by class name.
 * Fetches once and caches.
 */
@Injectable({ providedIn: 'root' })
export class ApiDataService {
  private cache: CompodocJson | null = null;
  private loading: Promise<CompodocJson> | null = null;

  /** Loads API entries for the given class names. Fetches compodoc JSON once and caches. */
  async loadEntries(classNames: string[]): Promise<ApiEntry[]> {
    if (classNames.length === 0) {
      return [];
    }
    const doc = await this.load();
    const all = [
      ...(doc.directives ?? []),
      ...(doc.components ?? []),
      ...(doc.injectables ?? []),
      ...(doc.classes ?? []),
    ];
    return classNames
      .map((name) => all.find((e) => e.name === name))
      .filter((e): e is CompodocEntry => !!e)
      .map((e) => this.mapEntry(e));
  }

  private async load(): Promise<CompodocJson> {
    if (this.cache) {
      return this.cache;
    }
    if (!this.loading) {
      this.loading = fetch('/assets/documentation.json')
        .then((r) => r.json() as Promise<CompodocJson>)
        .then((doc) => {
          this.cache = doc;
          return doc;
        });
    }
    return this.loading;
  }

  private mapEntry(e: CompodocEntry): ApiEntry {
    return {
      name: e.name,
      selector: e.selector ?? '',
      exportAs: e.exportAs ?? '',
      description: e.rawdescription?.trim() ?? '',
      inputs: (e.inputsClass ?? []).map((i) => this.mapInput(i)),
      outputs: (e.outputsClass ?? []).map((o) => this.mapOutput(o)),
      methods: (e.methodsClass ?? [])
        .filter((m) => !m.name.startsWith('_') && !m.name.startsWith('ng'))
        .map((m) => this.mapMethod(m)),
    };
  }

  private mapInput(i: CompodocProp): ApiInput {
    return {
      name: i.name,
      type: i.type ?? 'unknown',
      defaultValue: i.defaultValue ?? '',
      description: i.rawdescription?.trim() ?? '',
      required: i.required ?? false,
    };
  }

  private mapOutput(o: CompodocProp): ApiOutput {
    return {
      name: o.name,
      type: o.type ?? 'EventEmitter',
      description: o.rawdescription?.trim() ?? '',
    };
  }

  private mapMethod(m: CompodocMethod): ApiMethod {
    const args = m.args?.map((a) => `${a.name}: ${a.type}`).join(', ') ?? '';
    return {
      name: m.name,
      returnType: m.returnType ?? 'void',
      description: m.rawdescription?.trim() ?? '',
      args,
    };
  }
}
