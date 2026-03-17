export class Version {
  readonly major: string;
  readonly minor: string;
  readonly patch: string;

  constructor(public readonly full: string) {
    const [major = '0', minor = '0', patch = '0'] = full.split('.');
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }
}

export const VERSION = new Version('0.0.0-PLACEHOLDER');
