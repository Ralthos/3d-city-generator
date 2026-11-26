# Project files and VS Code guide

## Open in VS Code

1. Open Visual Studio Code.
2. Choose **File > Open Folder**.
3. Select the **3D Procedural City Generator** folder on your Desktop.

You can also open `3D Procedural City Generator.code-workspace` in VS Code. All source files are editable text files.

## Run the website

You need Node.js installed on your computer. This project includes Three.js locally and needs no npm dependency installation.

1. In VS Code, select **Terminal > New Terminal**.
2. Run:

```powershell
npm start
```

Alternatively, run `node server.mjs`.

3. Open **http://127.0.0.1:4173** in your browser.
4. Keep the terminal running while using the website. Press **Ctrl+C** to stop it.

Use the local server instead of double-clicking `dist/index.html`: the page loads JavaScript modules that need an HTTP server. Save edits in VS Code, then refresh the browser to see them.

## Which file is what?

| File or folder | Purpose | When to edit it |
| --- | --- | --- |
| `dist/index.html` | The page structure, title, labels, sliders, buttons, and help text. | Change the text or add a control. |
| `dist/style.css` | The layout, colors, fonts, spacing, sidebar, and mobile design. | Change how the website looks. |
| `dist/app.js` | Connects controls to the city, initializes Three.js, manages the camera, lighting, rain, and exports. | Change how the website responds to the user. |
| `dist/city.mjs` | Generates city data from the seed and settings: building locations, sizes, styles, heights, parks, and roads. | Change the city generation rules. |
| `dist/scene.mjs` | Turns city data into visible 3D geometry: building templates, roads, trees, cars, benches, and streetlights. | Change the appearance of the actual 3D city. |
| `dist/three.module.js` | The bundled Three.js graphics library. | Usually leave this library file alone. |
| `dist/OrbitControls.js` | The bundled Three.js camera control module for rotating, zooming, and panning. | Usually leave this library file alone; camera settings are in `app.js`. |
| `dist/THREE-LICENSE.txt` | The MIT license for Three.js and its controls. | Keep this file when distributing the project. |
| `release/3D Procedural City Generator.exe` | Standalone Windows app with all of `dist/` built in. Double-click to run. | Rebuild it with `build-exe.ps1` after editing `dist/`. |
| `launcher/CityLauncher.cs` | Source of the .exe: a small local web server that opens the city in an app window. | Change how the .exe starts. |
| `build-exe.ps1` | Builds the .exe with the C# compiler that ships with Windows. | Rarely. |
| `server.mjs` | A small local web server that serves the `dist` folder on port 4173. | Change the local server setup or port. |
| `package.json` | Defines the `npm start` and `npm test` shortcuts. | Change development commands. |
| `tests/city.test.mjs` | Tests city generation, reproducibility, bounds, parks, road spacing, and shop placement. | Add checks when changing generation rules. |
| `README.md` | Project overview, features, and general usage instructions. | Update the project documentation. |
| `PROJECT-FILES.md` | This file guide and VS Code instructions. | Update this guide if the file structure changes. |
| `3D Procedural City Generator.code-workspace` | A VS Code workspace that opens this folder. | Optional editor configuration. |

The `dist` folder contains the editable website source and the bundled libraries; there is no separate build step. The `.mjs` extension means a JavaScript module, and VS Code supports it.

## Run the tests

From the project folder in the VS Code terminal:

```powershell
npm test
```

## Included in the Desktop copy

All application files, bundled libraries, tests, documentation and workspace settings are included. The internal `.git` repository history is not needed to open or run the project and is excluded.
