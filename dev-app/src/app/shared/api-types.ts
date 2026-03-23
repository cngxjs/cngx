/** Parsed API entry from compodoc JSON. */
export interface ApiEntry {
  readonly name: string;
  readonly selector: string;
  readonly exportAs: string;
  readonly description: string;
  readonly inputs: readonly ApiInput[];
  readonly outputs: readonly ApiOutput[];
  readonly methods: readonly ApiMethod[];
}

export interface ApiInput {
  readonly name: string;
  readonly type: string;
  readonly defaultValue: string;
  readonly description: string;
  readonly required: boolean;
}

export interface ApiOutput {
  readonly name: string;
  readonly type: string;
  readonly description: string;
}

export interface ApiMethod {
  readonly name: string;
  readonly returnType: string;
  readonly description: string;
  readonly args: string;
}
