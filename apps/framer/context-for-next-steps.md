## Project Context: Framer App & Informational Website (framer.m8a.io)

This document summarizes the current state and plans for the **Framer** Tauri application and its associated informational website.

### Framer Tauri Application

**Core Purpose:**
Framer is a desktop application designed to help users delineate a specific area on their screen. This is particularly useful for screen recording, streaming, or focusing attention on a particular region.

**Current State & Key Features Implemented:**
*   **Window Behavior:**
    *   The application runs in a single, **fullscreen**, **always-on-top**, **undecorated** window.
    *   It has a **taskbar icon** for standard window management (`skipTaskbar: false`).
    *   The window background is transparent.
*   **Interactivity Toggling (Click-Through):**
    *   A global hotkey (`Ctrl+F9`) toggles the window's interactivity.
        *   **Interactive Mode:** The frame and UI controls are clickable. Clicks do not pass through transparent areas of the app window. The status light in the controls area is green.
        *   **Click-Through Mode:** The entire application window becomes unresponsive to mouse clicks, allowing users to interact with applications underneath. The status light in the controls area is red.
    *   This is achieved using `appWindow.setIgnoreCursorEvents(boolean)` and is managed by the `useWindowInteractiveState` composable and triggered via `@tauri-apps/plugin-global-shortcut` from the frontend.
*   **UI Components (Vue 3 with Quasar):**
    *   **`ControlsArea.vue`:** A floating control panel at the top-center of the screen.
        *   Includes an interactive status light (green/red).
        *   Buttons/menus for presets, custom size, settings (About, System Info), and closing the app.
        *   Frame on/off toggle.
    *   **`FrameDisplay.vue`:** Renders the visual frame on the screen.
        *   Supports dragging and resizing (via handles).
        *   Displays frame dimensions.
    *   **Dialogs:**
        *   `AboutDialog.vue`: Shows app name, version, author, and a "Buy me a coffee" link to Patreon (uses `@tauri-apps/plugin-shell`'s `open` API to launch in the default browser, requiring `shell:allow-open` capability).
        *   `SystemInfoDialog.vue`: Displays monitor, scaling, frame, and OS details.
        *   `CustomSizeDialog.vue`: Allows users to input custom frame dimensions.
*   **Composables:** The application heavily utilizes Vue composables for managing state and logic related to:
    *   Window interactivity (`useWindowInteractiveState`)
    *   System/app info (`useAppSysInfo`)
    *   Monitor detection and UI scaling (`useMonitorAndScaling`) - includes an empirical correction factor for zoom on high-DPI displays.
    *   Frame geometry, persistence (saving/loading state to store), presets, dragging, and resizing.
*   **Styling:**
    *   Quasar is used for UI components.
    *   Custom CSS is applied for theming dialogs, controls, and the frame. Font sizes for menus and dialogs have been increased by ~20% for better readability.
*   **Logging:**
    *   Uses `@tauri-apps/plugin-log` for frontend logging.
    *   Rust backend logging is configured in `main.rs` with different targets/levels for debug and release builds, including `Webview` target for debug.
*   **Build & Configuration:**
    *   `tauri.conf.json` is configured for a fullscreen, always-on-top, undecorated window with `devtools: true` for debug builds.
    *   Frontend is built with Vite.

**Known Minor Issues:**
*   A light blue bar (resembling a title bar) sometimes briefly appears at the top of the fullscreen window when the app is in click-through mode and focus is shifted to another application. Attempts to mitigate this by re-asserting `setFullscreen(true)` and `setDecorations(false)` during interactivity toggles have been made but the issue can still occur.

**Future Distribution Considerations (Discussed):**
*   **Windows:**
    *   Code signing is necessary to avoid SmartScreen warnings. This involves obtaining a commercial code signing certificate and configuring Tauri to sign the `.exe` and MSIX installer.
    *   Microsoft Store submission requires a developer account, an MSIX package (which Tauri can build and sign), and adherence to store policies.
*   **Linux:**
    *   OS-level code signing is not strictly required for apps to run.
    *   Tauri can generate `.deb`, `.rpm`, AppImage packages.
    *   Direct distribution of these files is possible. Providing checksums and GPG signing is recommended for user trust.

### VitePress Website Plan (framer.m8a.io)

**Purpose:**
A simple, static informational website for the Framer application. Maintenance should be straightforward.

**Technology Choice:**
*   **VitePress:** Chosen due to familiarity with Vite and Vue, and its suitability for creating clean, Markdown-based static sites with good performance and modern tooling.

**Required Pages & Content:**
1.  **Home Page (`index.md`):**
    *   Introduction to the Framer app.
    *   Download links:
        *   Direct download for the Windows application (e.g., `.msi` or `.exe`).
        *   Link to the Microsoft Store page (once available).
2.  **Docs Page (`docs/index.md` or similar):**
    *   Simple installation instructions for the Framer app.
    *   Basic usage guide:
        *   How to open/launch.
        *   Explanation of the `Ctrl+F9` hotkey for toggling interactivity.
        *   How to drag and resize the frame.
        *   Overview of the `ControlsArea` features.
3.  **Imprint Page (`imprint.md`):**
    *   Legally required information for German and European law (name, address, contact details, VAT ID if applicable, etc.).
4.  **Buy a Coffee Page (`support.md` or `buy-me-a-coffee.md`):**
    *   A friendly message encouraging support.
    *   A direct link to the Patreon page: `https://www.patreon.com/user?u=16255660`.

**Development & Deployment:**
*   Content will be written in Markdown files.
*   VitePress will be used to build the static HTML, CSS, and JS files.
*   The built static site can be deployed to any standard web hosting service that supports static files.

This summary should provide a good starting point for future development sessions.
