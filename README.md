# EcoSprout — Next.js project

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Implementation note

This is a **Next.js-hosted compatibility conversion**, not a native React component rewrite. The original single-file EcoSprout site is kept byte-for-byte in `public/ecosprout.html` and displayed by the Next.js app in a full-screen iframe. This preserves existing appearance, DOM scripts, drag-and-drop, modals, and embedded image without introducing regressions. The iframe has its own browser storage context under the same origin. For native Next.js components, its inline DOM-manipulating JavaScript must be refactored into React state and effects.
