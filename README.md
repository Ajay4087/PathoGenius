# PathoGenius

Offline pathology lab reporting desktop app. Enter patient details and results, preview an A4 report, then print or export a PDF. Reports also save and load as JSON on this computer.

## Run

```bash
npm install
npm run dev
```

Open the Vite URL in a browser, or launch the Electron shell:

```bash
npm run electron:dev
```

## Build

```bash
npm run build
npm run electron
```

`npm run electron` loads the built files in `dist/`.

Tailwind is compiled with PostCSS from `src/index.css`. There is no CSS-in-JS runtime.
