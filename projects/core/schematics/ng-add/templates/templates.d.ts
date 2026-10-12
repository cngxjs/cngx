// The build (esbuild `text` loader) and the specs (the vitest config) both
// import a `.tpl` file as its text.
declare module '*.tpl' {
  const content: string;
  export default content;
}
