// Ambient declaration for global stylesheet side-effect imports,
// e.g. `import "./globals.css"` in app/layout.tsx.
//
// Next.js ships types for CSS Modules (`*.module.css`) but not for bare
// global stylesheet imports. TypeScript 6's stricter side-effect import
// checking (noUncheckedSideEffectImports) requires this declaration.
declare module "*.css";
