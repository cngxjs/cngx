---
title: "CngxAudioStatus: Async click"
whenToUse: "Upload composes CngxAsyncClick with CngxAudioStatus. The explicit [state]=\"upload.state\" feeds the bridge; each transition plays tap -> success (or error). Toggle \"fail next\" to hear the error earcon. Click once to arm audio first (browser autoplay policy)."
symbols: [CngxAudioStatus]
---

# CngxAudioStatus: Async click

Upload composes CngxAsyncClick with CngxAudioStatus. The explicit [state]="upload.state" feeds the bridge; each transition plays tap -> success (or error). Toggle "fail next" to hear the error earcon. Click once to arm audio first (browser autoplay policy).

## Symbols

- `CngxAudioStatus`

## Setup

```ts
protected readonly upload = () =>
    new Promise<void>((resolve, reject) =>
      setTimeout(() => (this.failNext ? reject(new Error('Upload failed')) : resolve()), 900),
    );
```

## Wiring

```html
<button
    type="button"
    class="demo-button"
    [cngxAsyncClick]="upload"
    #uploadCtl="cngxAsyncClick"
    [state]="uploadCtl.state"
    [cngxAudioStatus]="'pending:tap, succeeded:success, failed:error'">
    @switch (uploadCtl.status()) {
      @case ('pending') { Uploading... }
      @case ('success') { Uploaded }
      @case ('error') { Failed }
      @default { Upload }
    }
  </button>
```
