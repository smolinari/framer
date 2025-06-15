console.log("Control_renderer.js: Script execution started."); // Very first line

console.log("Control_renderer.js loaded");

document.addEventListener('DOMContentLoaded', async () => { // Made async
    console.log("Control_renderer.js: DOMContentLoaded event fired.");
    const toggleButton = document.getElementById('toggle-frame-btn');
    let isFrameWindowVisible = false; // Main frame window now starts hidden

    const CONTROL_PANEL_HEIGHT = 50; // This is the INTENDED height from tauri.conf.json

    // Function to update button text
    function updateButtonText() {
        if (toggleButton) {
            toggleButton.textContent = `Frame ${isFrameWindowVisible ? 'ON' : 'OFF'}`;
        }
    }

    // Initial button text update
    updateButtonText();

    // Function to perform window setup
    async function setupWindows() {
        try {
            console.log("Control_renderer.js: Setting up window positions and sizes...");
            const { window: tauriWindowModule } = window.__TAURI__; // Alias for clarity
            console.log("Control_renderer.js: tauriWindowModule object:", tauriWindowModule);
            console.log("Control_renderer.js: typeof tauriWindowModule.primaryMonitor:", typeof tauriWindowModule.primaryMonitor);

            let primaryMonitor = await tauriWindowModule.primaryMonitor();
            console.log("Control_renderer.js: primaryMonitor() promise resolved. Value:", primaryMonitor);

            if (!primaryMonitor) {
                console.warn("Control_renderer.js: primaryMonitor() returned a falsy value. Attempting fallback to availableMonitors().");
                if (typeof tauriWindowModule.availableMonitors === 'function') {
                    const monitors = await tauriWindowModule.availableMonitors();
                    console.log("Control_renderer.js: availableMonitors() returned:", monitors);
                    if (monitors && monitors.length > 0) {
                        primaryMonitor = monitors.find(m => m.isPrimary) || monitors[0]; // Prefer one marked isPrimary, else take the first
                        console.log("Control_renderer.js: Using monitor from availableMonitors():", primaryMonitor);
                    } else {
                        console.error("Control_renderer.js: availableMonitors() returned no monitors or an empty array.");
                    }
                } else {
                    console.error("Control_renderer.js: tauriWindowModule.availableMonitors is not a function.");
                }
                if (!primaryMonitor) { // If fallback also failed
                    console.error("Control_renderer.js: Could not obtain monitor information via primaryMonitor() or availableMonitors(). Aborting setup.");
                    if (toggleButton) toggleButton.disabled = true;
                    return;
                }
            }
            // Ensure screenWidth and screenHeight are numbers
            const screenWidth = parseFloat(primaryMonitor.size.width);
            const screenHeight = parseFloat(primaryMonitor.size.height);

            console.log("Control_renderer.js: primaryMonitor.size object:", JSON.stringify(primaryMonitor.size, null, 2));
            console.log(`Control_renderer.js: Parsed screenWidth: ${screenWidth} (type: ${typeof screenWidth}), screenHeight: ${screenHeight} (type: ${typeof screenHeight})`);
            console.log(`Control_renderer.js: Screen dimensions: ${screenWidth}x${screenHeight}`);

            // Control Window: We rely on tauri.conf.json for its initial state.
            // We'll read its actual geometry for logging, but base main window on INTENDED control height.
            const thisControlWindow = tauriWindowModule.getCurrentWindow();
            console.log("Control_renderer.js: Reading control window's actual geometry as placed by Tauri/OS based on tauri.conf.json.");
            
            const actualPosition = await thisControlWindow.outerPosition(); // Log this for debugging
            const actualSize = await thisControlWindow.outerSize();       // Log this for debugging
            console.log(`Control_renderer.js: Actual control window outerPosition (API reported): x:${actualPosition.x}, y:${actualPosition.y}`);
            console.log(`Control_renderer.js: Actual control window outerSize (API reported): width:${actualSize.width}, height:${actualSize.height}`);
            await thisControlWindow.setAlwaysOnTop(true); // Ensure it's on top

            // Configure Main Window
            const mainFrameWindow = await tauriWindowModule.Window.getByLabel('main');
            if (mainFrameWindow) {
                const mainFrameWidth = screenWidth;
                
                // Position the main window based on the INTENDED space for the control window
                // --- MODIFICATION: Use actual height of control window for main window Y offset ---
                const mainFrameX = 0; 
                const actualControlTopY = parseFloat(actualPosition.y) || 0;
                const actualControlHeight = parseFloat(actualSize.height) || CONTROL_PANEL_HEIGHT; // Use actual height, fallback to configured
                const mainFrameY = actualControlTopY + actualControlHeight; 
                const mainFrameHeight = screenHeight - mainFrameY; 
                // --- End MODIFICATION ---

                console.log(`Control_renderer.js: Using ACTUAL control window bottom (Y: ${mainFrameY}px) for main window Y offset.`);

                const isMaximized = await mainFrameWindow.isMaximized();
                if (isMaximized) {
                    console.log("Control_renderer.js: Main window is maximized, unmaximizing...");
                    await mainFrameWindow.unmaximize();
                }
                
                console.log(`Control_renderer.js: For main window setSize - Width: ${mainFrameWidth} (type: ${typeof mainFrameWidth}), Height: ${mainFrameHeight} (type: ${typeof mainFrameHeight})`);
                if (isNaN(mainFrameWidth) || isNaN(mainFrameHeight)) console.error("Control_renderer.js: main window dimensions are NaN!");
                await mainFrameWindow.setSize(new tauriWindowModule.LogicalSize(mainFrameWidth, mainFrameHeight));
                console.log(`Control_renderer.js: Set main window size to ${mainFrameWidth}x${mainFrameHeight}`);
                await mainFrameWindow.setPosition(new tauriWindowModule.LogicalPosition(mainFrameX, mainFrameY));
                console.log(`Control_renderer.js: Set main window position to x:${mainFrameX}, y:${mainFrameY}`);
            } else {
                console.error("Control_renderer.js: Main frame window ('main') not found during setup.");
            }
            console.log("Control_renderer.js: Window setup complete.");

        } catch (e) {
            console.error("Control_renderer.js: Error during initial window setup:", e);
            if (toggleButton) toggleButton.disabled = true;
        }
    }

    setupWindows(); // Call the setup function

    if (toggleButton) {
        console.log("Control_renderer.js: Toggle button element found. Adding click listener.");
        toggleButton.addEventListener('click', async () => {
            let mainFrameWindow = null;
            try {
                mainFrameWindow = await window.__TAURI__.window.Window.getByLabel('main');
            } catch (e) {
                console.error("Control_renderer.js: Error getting mainFrameWindow for toggle:", e);
            }
            
            if (!mainFrameWindow) {
                console.error("Main frame window ('main') not found for toggle. Aborting toggle action.");
                return;
            }

            isFrameWindowVisible = !isFrameWindowVisible;
            console.log("New isFrameWindowVisible state:", isFrameWindowVisible);

            try {
                if (isFrameWindowVisible) {
                    console.log("Attempting to show main frame window...");
                    await mainFrameWindow.show();
                    console.log("mainFrameWindow.show() called.");
                    await mainFrameWindow.setIgnoreCursorEvents(false); 
                    console.log("mainFrameWindow.setIgnoreCursorEvents(false) called.");
                    await mainFrameWindow.emit("set-main-interactive-globally", true);
                    console.log("Emitted 'set-main-interactive-globally' (true) to main window.");

                    try {
                        const thisControlWindow = window.__TAURI__.window.getCurrentWindow();
                        if (thisControlWindow) {
                            console.log("Control_renderer.js: Attempting to bring control window to front.");
                            await thisControlWindow.setAlwaysOnTop(false);
                            await thisControlWindow.setAlwaysOnTop(true); 
                            await thisControlWindow.setFocus();
                            console.log("Control_renderer.js: setFocus called on control window.");
                            const isFocused = await thisControlWindow.isFocused();
                            console.log(`Control_renderer.js: Control window isFocused after setFocus: ${isFocused}`);
                        }
                    } catch (e) {
                        console.error("Control_renderer.js: Error focusing control window:", e);
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
                console.error("Control_renderer.js: Error during mainFrameWindow operations (show/hide/emit/setIgnoreCursorEvents):", e);
            }
            updateButtonText();
        });
    } else {
        console.error("Toggle button ('toggle-frame-btn') not found in control window.");
    }
});
