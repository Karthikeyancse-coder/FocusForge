# 3D Models Directory

Upload your 3D `.glb` model files here so the interactive 3D viewer can load them.

## Expected Files

- `goku_ssj.glb` (Default)

If you upload a model with a different filename, make sure to update the path inside:
- `/src/pages/dashboard.tsx` (ModelViewer prop)
- `/src/components/ModelViewer.tsx` (fallback default prop)
