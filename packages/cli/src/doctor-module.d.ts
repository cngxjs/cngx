// @cngx/doctor ships no type declarations; the two exports `cngx doctor` calls,
// typed from their JSDoc in packages/doctor/cngx-doctor.mjs. cli-adapter.spec.ts
// imports the in-tree module and asserts these keys, so a drift fails a spec.

declare module '@cngx/doctor/cngx-doctor.mjs' {
  export interface DoctorArgs {
    projectDir: string;
    json: boolean;
    help: boolean;
    version: boolean;
    unknownFlags: string[];
  }

  export interface DoctorResult {
    findings: unknown[];
    output: string;
    warnings: string[];
    exitCode: number;
  }

  export function parseArgs(argv: string[]): DoctorArgs;
  export function runDoctor(argv: string[]): DoctorResult;
}
