# 3D Procedural City Generator

A browser-based Three.js project with six authored procedural building templates: pitched-roof houses, shops with striped awnings, industrial workshops, apartments with balconies, glass offices, and stepped towers. Detailed streets include zebra crossings, cars, streetlights, trees, benches, and landscaped parks and plazas. A simple settings sidebar provides live layout controls, reproducible seeds, lighting, rain, auto-orbit, and exports.

## Run the Windows app (no install)

Double-click `release\3D Procedural City Generator.exe`. It opens the city in its own window (Microsoft Edge app mode, or your default browser). Keep the small console window open while you use it; close it to quit. The .exe contains all of `dist\`, so you can copy it to another Windows PC on its own. It needs no Node.js or .NET install beyond what ships with Windows 10/11.

After editing files in `dist\`, rebuild the .exe with:

```powershell
powershell -ExecutionPolicy Bypass -File build-exe.ps1
```

## Run locally

Install Node.js, then run `node server.mjs` in this folder and open http://localhost:4173. The Three.js and OrbitControls modules are included in `dist/`. The interface uses system fonts.

Adjust sliders; the city regenerates when a slider is released. **Generate new city** selects a fresh seed. Open **More settings** to adjust parks and road width or enter a seed. Press Enter or **Apply** to use it. Identical seeds and parameters yield identical cities.

Density is the occupancy probability of four lots per urban block. Park & plaza coverage sets the proportion of whole city blocks reserved for landscaping. Empty urban lots also become small green spaces. The green-space counter counts dedicated park/plaza blocks. The height cap is in modeled meters, using 3.4 meters per floor; architectural roof details are additional. Building types have individual height limits, so houses remain low-rise. Road width changes the block spacing while preserving building lots.

Drag to rotate, scroll/pinch to zoom, and right-drag/two-finger drag to move. Top view locks rotation; 3D view restores it. Reset frames the city. View provides lighting, rain, and auto-rotate. Save downloads a scene PNG or a JSON layout containing the rendered city's seed, settings, and building data. Downloads depend on browser permissions.

Run `node --test tests/city.test.mjs` to verify reproducible generation, density endpoints, size/height bounds, architectural variety, dedicated parks, adjustable road spacing, and nonintersecting shop frontages.

Three.js is MIT licensed. See `dist/THREE-LICENSE.txt`.
