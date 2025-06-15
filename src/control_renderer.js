// control_renderer.js
console.log("Control_renderer.js: Script execution started."); // Very first line

console.log("Control_renderer.js loaded");

document.addEventListener('DOMContentLoaded', async () => { // Made async
    console.log("Control_renderer.js: DOMContentLoaded event fired.");
    const toggleButton = document.getElementById('toggle-frame-btn');
    let isFrameWindowVisible = false; // Main frame window now starts hidden

    let screenWidth = 0; // To store screen dimensions, accessible by toggle handler
    let screenHeight = 0; // To store screen dimensions, accessible by toggle handler

    const CONTROL_PANEL_HEIGHT = 50; // This is the INTENDED height from tauri.conf.json

    function updateButtonText() {
        if (toggleButton) {
            toggleButton.textContent = `Frame ${isFrameWindowVisible ? 'ON' : 'OFF'}`;
        }
    }
    updateButtonText();

    async function setupWindows() {
        try {
            console.log("Control_renderer.js: Setting up window positions and sizes...");
            const { window: tauriWindowModule, core: tauriCoreModule } = window.__TAURI__;
            
            let primaryMonitor = await tauriWindowModule.primaryMonitor();
            if (!primaryMonitor) {
                console.warn("Control_renderer.js: primaryMonitor() failed. Falling back to availableMonitors().");
                const monitors = await tauriWindowModule.availableMonitors();
                if (monitors && monitors.length > 0) {
                    primaryMonitor = monitors.find(m => m.isPrimary) || monitors[0];
                }
            }
            if (!primaryMonitor) {
                console.error("Control_renderer.js: Could not obtain monitor information. Aborting setup.");
                if (toggleButton) toggleButton.disabled = true;
                return;
            }

            // Assign to higher-scoped variables
            screenWidth = parseFloat(primaryMonitor.size.width);
            screenHeight = parseFloat(primaryMonitor.size.height);
            console.log(`Control_renderer.js: Screen dimensions: ${screenWidth}x${screenHeight}`);

            // Control Window: Attempt to position via Rust command
            // We'll rely on tauri.conf.json for initial placement and OS for final say.
            // The Rust command and programmatic setPosition/setSize for the control window
            // did not reliably override OS placement or provide accurate visual feedback.
            const thisControlWindow = tauriWindowModule.getCurrentWindow();

            const actualPositionJS = await thisControlWindow.outerPosition();
            const actualSizeJS = await thisControlWindow.outerSize();
            console.log(`Control_renderer.js: Control window initial outerPosition (JS API reported): x:${actualPositionJS.x}, y:${actualPositionJS.y}`);
            console.log(`Control_renderer.js: Control window initial outerSize (JS API reported): width:${actualSizeJS.width}, height:${actualSizeJS.height}`);
            // Ensure it's always on top, as this might be re-asserted by the OS.
            await thisControlWindow.setAlwaysOnTop(true);
            
            // Configure Main Window
            const mainFrameWindow = await tauriWindowModule.Window.getByLabel('main');
            if (mainFrameWindow) {
                const mainFrameWidth = screenWidth;
                let mainFrameY, mainFrameHeight;

                // Position the main window based on the INTENDED space for the control window
                mainFrameY = CONTROL_PANEL_HEIGHT; 
                mainFrameHeight = screenHeight - CONTROL_PANEL_HEIGHT;
                
                const mainFrameX = 0; 
                console.log(`Control_renderer.js: Main window target: Y:${mainFrameY}px, H:${mainFrameHeight}px`);

                const isMaximized = await mainFrameWindow.isMaximized();
                if (isMaximized) await mainFrameWindow.unmaximize();
                
                await mainFrameWindow.setSize(new tauriWindowModule.LogicalSize(mainFrameWidth, mainFrameHeight));
                await mainFrameWindow.setPosition(new tauriWindowModule.LogicalPosition(mainFrameX, mainFrameY));
                console.log(`Control_renderer.js: Set main window position to x:${mainFrameX}, y:${mainFrameY} and size to ${mainFrameWidth}x${mainFrameHeight}`);
            } else {
                console.error("Control_renderer.js: Main frame window ('main') not found.");
            }
            console.log("Control_renderer.js: Window setup complete.");

        } catch (e) {
            console.error("Control_renderer.js: Error during initial window setup:", e);
            if (toggleButton) toggleButton.disabled = true;
        }
    }

    setupWindows();

    if (toggleButton) {
        toggleButton.addEventListener('click', async () => {
            let mainFrameWindow = null;
            try {
                mainFrameWindow = await window.__TAURI__.window.Window.getByLabel('main');
            } catch (e) {
                console.error("Control_renderer.js: Error getting mainFrameWindow for toggle:", e);
            }
            if (!mainFrameWindow) {
                console.error("Main frame window ('main') not found for toggle.");
                return;
            }
            isFrameWindowVisible = !isFrameWindowVisible;
            updateButtonText(); // Update button text immediately
            try {
                if (isFrameWindowVisible) {
                    console.log("Attempting to show main frame window...");
                    const { LogicalSize, LogicalPosition } = window.__TAURI__.window; // Destructure for convenience

                    // Ensure it's not maximized and set its correct size/position BEFORE showing
                    if (await mainFrameWindow.isMaximized()) {
                        console.log("Control_renderer.js: Main window is maximized, unmaximizing before show.");
                        await mainFrameWindow.unmaximize();
                        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay after unmaximize
                    }

                    // Use stored screenWidth and screenHeight
                    const mainFrameWidth = screenWidth;
                    const mainFrameX = 0; 
                    const mainFrameY = CONTROL_PANEL_HEIGHT;
                    const mainFrameHeight = screenHeight - CONTROL_PANEL_HEIGHT;

                    console.log(`Control_renderer.js: Setting initial main window geometry - X:${mainFrameX}, Y:${mainFrameY}, W:${mainFrameWidth}, H:${mainFrameHeight}`);
                    await mainFrameWindow.setSize(new LogicalSize(mainFrameWidth, mainFrameHeight));
                    await mainFrameWindow.setPosition(new LogicalPosition(mainFrameX, mainFrameY));
                    
                    // Now show the window
                    console.log("Control_renderer.js: Calling mainFrameWindow.show().");
                    await mainFrameWindow.show();
                    console.log("Control_renderer.js: mainFrameWindow.show() called. Delaying for OS to render and settle...");
                    await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay for OS to fully process the show command

                    // Forcefully re-apply the desired geometry one last time AFTER show and a good delay
                    console.log(`Control_renderer.js: Finalizing main window geometry - X:${mainFrameX}, Y:${mainFrameY}, W:${mainFrameWidth}, H:${mainFrameHeight}`);
                    if (await mainFrameWindow.isMaximized()) await mainFrameWindow.unmaximize(); // Ensure not maximized before final set
                    await mainFrameWindow.setSize(new LogicalSize(mainFrameWidth, mainFrameHeight));
                    await mainFrameWindow.setPosition(new LogicalPosition(mainFrameX, mainFrameY));
                    console.log("Control_renderer.js: Final geometry set. Delaying slightly before making interactive.");
                    await new Promise(resolve => setTimeout(resolve, 50)); // Short delay before interactivity

                    await mainFrameWindow.setIgnoreCursorEvents(false);
                    console.log("mainFrameWindow.setIgnoreCursorEvents(false) called.");
                    await mainFrameWindow.emit("set-main-interactive-globally", true);
                    console.log("Emitted 'set-main-interactive-globally' (true) to main window.");

                    const thisControlWindow = window.__TAURI__.window.getCurrentWindow();
                    if (thisControlWindow) {
                        console.log("Control_renderer.js: Attempting to bring control window to front.");
                        await thisControlWindow.setAlwaysOnTop(false);
                        await thisControlWindow.setAlwaysOnTop(true); 
                        await thisControlWindow.setFocus();
                        console.log(`Control_renderer.js: Control window isFocused after setFocus: ${await thisControlWindow.isFocused()}`);
                    }
                } else {
                    await mainFrameWindow.emit("set-main-interactive-globally", false);
                    console.log("Emitted 'set-main-interactive-globally' (false) to main window.");
                    await mainFrameWindow.setIgnoreCursorEvents(true);
                    console.log("mainFrameWindow.setIgnoreCursorEvents(true) called.");
                    setTimeout(async () => { 
                        await mainFrameWindow.hide(); 
                        console.log("mainFrameWindow.hide() called (after delay).");
                    }, 50);
                }
            } catch (e) {
                console.error("Control_renderer.js: Error during mainFrameWindow toggle operations:", e);
            }
        });
    } else {
        console.error("Toggle button ('toggle-frame-btn') not found.");
    }
});
