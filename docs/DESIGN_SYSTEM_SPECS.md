# FocusForge AI - Design System & Animation Specs

## 1. Design System
- Semantic CSS Variable structure ensures pristine Light/Dark toggling.
- Colors are defined in `src/index.css`.
- Core brand color is `--accent-primary`, modifying UI glow intensity across the whole dash.

## 2. Animation Spec Sheet (Framer Motion)
- **Button Micro-interactions**: `whileHover={{ scale: 1.02 }}`, spring stiffness 400.
- **List Staggering**: `AnimatePresence` with index delays (`delay: index * 0.05`).
- **Progress Bars**: Simple `easeInOut` fills lasting 1.5s down to target widths.

## 3. Theme Toggle Guide
- Controlled via `ThemeProvider` context.
- Updates `<html class="dark">` natively.
- UI elements adapt purely through CSS specific layer variables.

## 4. 3D Asset Pipeline Plan (Post-MVP)
- **Engine**: Three.js mapped through `@react-three/fiber` and `@react-three/drei`.
- **Authoring**: Low-poly objects optimized in Blender.
- **Rendering**: Uses `<Suspense>` loaders and environment presets triggered by the `theme` variable.
