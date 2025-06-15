# Integrating Vue.js with Quasar for Tauri

This document outlines the general steps and considerations for integrating Vue.js with the Quasar framework (as a Vue plugin) into a Tauri application. This approach allows leveraging Quasar's rich set of prebuilt UI components for a more polished user interface.

## Overview of the Process

Integrating Vue and Quasar is a significant shift from a vanilla HTML, CSS, and JavaScript frontend. It involves setting up a modern JavaScript frontend toolchain.

1.  **Set up a Vue Project:** - Done
    *   Create a new Vue project, typically using a modern build tool like Vite (recommended for its speed and ease of use) or Vue CLI.
    *   This new Vue project will house your frontend code and would usually reside in a subdirectory like `src-frontend` within your main Tauri project directory (e.g., `/home/scott/tmp-dev/Framer/src-frontend/`).

2.  **Add Quasar to the Vue Project:**
    *   Install Quasar as a Vue plugin into your newly created Vue project. Quasar's documentation provides clear instructions for this (often involving `npm install quasar @quasar/extras` and then configuring it in your Vue app's entry point, e.g., `main.js` or `main.ts`).
    *   This integration gives you access to Quasar's component library (e.g., `<q-btn>`, `<q-input>`, `<q-layout>`), directives, and its styling system (including Material Design icons and themes).

3.  **Integrate Tauri with the Vue + Quasar Project:**
    *   **`tauri.conf.json` Update:**
        *   Modify the `build.devPath` in your `/home/scott/tmp-dev/Framer/src-tauri/tauri.conf.json` to point to the development server URL of your Vue project (e.g., `http://localhost:5173` if using Vite's default).
        *   Modify the `build.distDir` (previously `frontendDist`) to point to the build output directory of your Vue project (e.g., `../src-frontend/dist`).
    *   **Tauri API Installation:**
        *   Install the `@tauri-apps/api` package as a development dependency in your Vue project (`npm install --save-dev @tauri-apps/api` or `yarn add --dev @tauri-apps/api`). This allows your Vue components to interact with Tauri's backend functionalities.

4.  **Migrate Existing Frontend Logic:**
    *   The current JavaScript logic in `/home/scott/tmp-dev/Framer/src/renderer.js` (handling frame drawing, resizing, dragging, dimension display, and the toggle button) will need to be re-implemented within Vue components.
    *   Utilize Vue's reactivity system (e.g., `ref`, `reactive`) for managing state like `isFrameActive`, frame dimensions, etc.
    *   Structure the UI using Vue components. For example, the toggle button, the frame itself, and the dimension display could each become separate Vue components.

5.  **Utilize Quasar Components:**
    *   Replace existing HTML elements with their Quasar equivalents where appropriate to enhance styling and functionality. For example:
        *   The toggle button can become a `<q-btn>`.
        *   If you plan a settings panel, Quasar offers `<q-dialog>`, `<q-drawer>`, `<q-input>`, `<q-select>`, etc.

## Benefits

*   **Rich UI Component Library:** Access to a wide range of pre-built, high-quality components.
*   **Improved Developer Experience:** Vue's component-based architecture and reactivity can lead to more organized and maintainable code.
*   **Consistent Styling:** Quasar provides a consistent look and feel, often based on Material Design.
*   **Responsiveness & Theming:** Built-in support for responsive layouts and easy theming.

## Considerations

*   **Learning Curve:** Requires familiarity with Vue.js and understanding Quasar's specific components and conventions.
*   **Project Restructuring:** Involves setting up a separate frontend project with its own build process.
*   **Initial Setup Time:** There's an upfront time investment to configure the Vue + Quasar + Tauri toolchain.
*   **Build Process:** You'll have two main build steps: one for the Vue/Quasar frontend (e.g., `npm run build` in the frontend directory) and one for the Tauri application (`npm run tauri build`).

## Next Steps (If Proceeding)

1.  Choose a Vue project scaffolding tool (Vite is recommended).
2.  Create the new Vue project in a dedicated frontend directory.
3.  Follow Quasar's official documentation to add it as a Vue plugin.
4.  Adjust `tauri.conf.json` to point to the new frontend's development server and build output.
5.  Start migrating a small piece of functionality (e.g., the toggle button) to a Vue/Quasar component to test the integration.