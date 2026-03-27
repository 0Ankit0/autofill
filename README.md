# AI Form Autofill (Offline-First)

## What changed

This extension now defaults to an **offline semantic generator** that creates synthetic, locale-aware values from detected field metadata and validation rules. No API key is required for first-run usage.

Optional enhancement layers:
1. Chrome Prompt API (only when enabled and available).
2. External providers (only when user configures provider keys).

## Project layout

- `public/icons`, `public/test-pages`
- `src/background`, `src/content`, `src/form`, `src/generation`, `src/providers`, `src/shared`
- `src/ui/popup`, `src/ui/options`
- `tests/unit`, `tests/integration`, `tests/e2e`

## Build and test

```bash
npm install
npm run build
npm test
npm run test:e2e
```

`npm run build` emits an unpacked extension in `dist/`.

## Current robustness scope

- Native text/email/tel/number/date/textarea/select/multi-select/radio/checkbox controls.
- Same-origin iframe injection enabled via manifest content scripts (`all_frames: true`).
- MutationObserver refresh for dynamic form insertion/rerenders.
- Structured per-field fill results with failure reason/recovery hint.

## Explicitly unsupported (for now)

- CAPTCHA
- File uploads
- Payment-provider cross-origin iframes
- Non-native custom widgets that do not expose real inputs
