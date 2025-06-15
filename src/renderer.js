console.log("Renderer.js loaded - Top of file.");
console.log("Renderer.js: Top-level check for window.__TAURI__:", window.__TAURI__);

document.addEventListener('DOMContentLoaded', async () => {
  console.log("Renderer.js: DOMContentLoaded event fired.");
  console.log("Renderer.js: DOMContentLoaded - check for window.__TAURI__:", window.__TAURI__);
  const framerMain = document.getElementById('framer-main');
  // Note: framerMain might be null if the element doesn't exist yet, but we'll check later.
  const body = document.body;
  let appWindow = null; // For potential direct window operations if needed

  let isDrawing = false;
  let isMainWindowGloballyInteractive = true; // New flag: controls if body clicks initiate drawing
  let isResizing = false;
  let isDraggingFrame = false;
  let activeHandle = null;

  let drawStartX, drawStartY;
  let resizeStartX, resizeStartY;
  let dragFrameStartX, dragFrameStartY;
  let initialFrameOffsetX, initialFrameOffsetY;
  let initialFrameRect = {};

  // let controlWindow = null; // No longer needed here for click-through
  // let controlWindowRect = null; // No longer needed here for click-through

  // Min dimensions for the frame
  const MIN_WIDTH = 20; // e.g., 20px
  const MIN_HEIGHT = 20; // e.g., 20px

  // Attempt to get appWindow and set up event listener from Tauri
  if (window.__TAURI__) {
    console.log("Renderer.js: window.__TAURI__ is available.");

    // Based on the logged keys, getCurrentWindow() should be directly on window.__TAURI__.window
    if (window.__TAURI__.window) {
      if (typeof window.__TAURI__.window.getCurrentWindow === 'function') {
        try {
          appWindow = window.__TAURI__.window.getCurrentWindow();
          if (appWindow) {
            console.log("Renderer.js: Tauri appWindow object assigned via .window.getCurrentWindow().");
          } else {
            console.error("Renderer.js: .window.getCurrentWindow() returned a falsy value.");
          }
        } catch (e) {
          console.error("Renderer.js: Error calling .window.getCurrentWindow():", e);
        }
      } else {
        console.error("Renderer.js: .window.getCurrentWindow is NOT a function on window.__TAURI__.window.");
        console.log("window.__TAURI__.window keys:", Object.keys(window.__TAURI__.window));
      }
    } else {
      console.error("Renderer.js: window.__TAURI__.window object itself is NOT available.");
    }

    // Removed logic for getting controlWindowRect as main window should not overlap it.

    if (window.__TAURI__.event && typeof window.__TAURI__.event.listen === 'function') {
      console.log("Renderer.js: window.__TAURI__.event.listen is a function. Attempting to set up listener for 'set-main-interactive-globally'...");
      try {
        await window.__TAURI__.event.listen("set-main-interactive-globally", (event) => {
          isMainWindowGloballyInteractive = event.payload;
          console.log(`Renderer.js: Received 'set-main-interactive-globally', new state: ${isMainWindowGloballyInteractive}`);
        });
        console.log("Renderer.js: Event listener for 'set-main-interactive-globally' set up successfully.");
      } catch (error) {
        console.error("Renderer.js: ERROR setting up event listener 'set-main-interactive-globally':", error);
      }
    } else {
      console.error("Renderer.js: window.__TAURI__.event or window.__TAURI__.event.listen is NOT available/not a function.");
      console.log("Renderer.js: typeof window.__TAURI__.event:", typeof window.__TAURI__.event);
      if(window.__TAURI__.event) { // Check if event object itself exists before trying to access listen
        console.log("Renderer.js: typeof window.__TAURI__.event.listen:", typeof window.__TAURI__.event.listen);
      }
    }
  } else {
    console.error("Renderer.js: CRITICAL - window.__TAURI__ is NOT available at the point of API access.");
  }

  // Function to update frame's position and dimensions
  function updateFrameRect(x, y, width, height) {
    if (framerMain) {
      framerMain.style.left = `${x}px`;
      framerMain.style.top = `${y}px`;
      framerMain.style.width = `${width}px`;
      framerMain.style.height = `${height}px`;
    }
  }

  function handleBodyMouseDown(event) {
    // Removed check for controlWindowRect as windows should not overlap.

    // Only initiate drawing if the mousedown is directly on the body,
    // not on the framer-main div or its children (handles).
    // AND if the main window is set to be globally interactive for drawing
    // AND it's a left-click
    if (event.button === 0 && event.target === body && isMainWindowGloballyInteractive) {
      isDrawing = true;
      drawStartX = event.clientX;
      drawStartY = event.clientY;

      // Set initial position for the frame at the click point with zero size
      updateFrameRect(drawStartX, drawStartY, 0, 0);
      if (framerMain) {
        framerMain.style.display = 'block'; // Ensure it's visible if it was hidden
      }

      document.addEventListener('mousemove', handleBodyMouseMove);
      document.addEventListener('mouseup', handleBodyMouseUp);
    }
  }

  function handleBodyMouseMove(event) {
    if (!isDrawing) return;

    const currentX = event.clientX;
    const currentY = event.clientY;

    const newX = Math.min(drawStartX, currentX);
    const newY = Math.min(drawStartY, currentY);
    const newWidth = Math.abs(currentX - drawStartX);
    const newHeight = Math.abs(currentY - drawStartY);

    updateFrameRect(newX, newY, newWidth, newHeight);
  }

  function handleBodyMouseUp() {
    if (isDrawing) {
      isDrawing = false;
      document.removeEventListener('mousemove', handleBodyMouseMove);
      document.removeEventListener('mouseup', handleBodyMouseUp);
      console.log('Frame drawing finalized.');
      // The frame is now set. Its current dimensions are stored in its style.
    }
  }

  function handleResizeMouseDown(event) {
    // Only proceed if it's a left-click
    if (event.button !== 0) return;

    event.stopPropagation(); // Prevent body mousedown from firing
    isResizing = true;
    activeHandle = event.target.id;
    resizeStartX = event.clientX;
    resizeStartY = event.clientY;

    const rect = framerMain.getBoundingClientRect();
    initialFrameRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  }

  function handleResizeMouseMove(event) {
    if (!isResizing || !activeHandle) return;

    const dx = event.clientX - resizeStartX;
    const dy = event.clientY - resizeStartY;

    let newX = initialFrameRect.left;
    let newY = initialFrameRect.top;
    let newWidth = initialFrameRect.width;
    let newHeight = initialFrameRect.height;

    if (activeHandle.includes('e')) { // East (right)
      newWidth = Math.max(MIN_WIDTH, initialFrameRect.width + dx);
    }
    if (activeHandle.includes('w')) { // West (left)
      newWidth = Math.max(MIN_WIDTH, initialFrameRect.width - dx);
      newX = initialFrameRect.left + dx;
      if (initialFrameRect.width - dx < MIN_WIDTH) {
        newX = initialFrameRect.left + initialFrameRect.width - MIN_WIDTH;
      }
    }
    if (activeHandle.includes('s')) { // South (bottom)
      newHeight = Math.max(MIN_HEIGHT, initialFrameRect.height + dy);
    }

    // Determine if it's a north handle (used for Y position adjustment)
    const isNorthHandle = activeHandle === 'handle-n' || activeHandle === 'handle-nw' || activeHandle === 'handle-ne';

    if (isNorthHandle && !event.ctrlKey) { // Apply non-proportional N-handle logic only if Ctrl is not pressed
      // If Ctrl is pressed, height will be determined by aspect ratio logic below.
      // The newY adjustment for N-handles will still happen later based on the final newHeight.
      newHeight = Math.max(MIN_HEIGHT, initialFrameRect.height - dy);
      // newY adjustment will happen after all width/height calculations
    }

    if (event.ctrlKey && initialFrameRect.width > 0 && initialFrameRect.height > 0) {
      const aspectRatio = initialFrameRect.width / initialFrameRect.height;

      let proposedW = initialFrameRect.width;
      let proposedH = initialFrameRect.height;

      // Calculate width/height based on which part of handle is active
      if (activeHandle.includes('e')) { proposedW = initialFrameRect.width + dx; }
      if (activeHandle.includes('w')) { proposedW = initialFrameRect.width - dx; }
      if (activeHandle.includes('s')) { proposedH = initialFrameRect.height + dy; }
      if (activeHandle.includes('n')) { proposedH = initialFrameRect.height - dy; }

      const changedW = activeHandle.includes('e') || activeHandle.includes('w');
      const changedH = activeHandle.includes('n') || activeHandle.includes('s');

      // Determine primary scaling dimension
      // If E/W is involved and its delta is relatively larger or it's the only change, scale by width.
      // Otherwise, if N/S is involved, scale by height.
      if (changedW && (!changedH || Math.abs(dx / (initialFrameRect.width || 1)) >= Math.abs(dy / (initialFrameRect.height || 1)))) {
        newWidth = proposedW;
        newHeight = newWidth / aspectRatio;
      } else if (changedH) {
        newHeight = proposedH;
        newWidth = newHeight * aspectRatio;
      } else { // Fallback, though should be covered
        newWidth = proposedW;
        newHeight = proposedH;
      }

      // Apply MIN constraints and readjust to maintain aspect ratio
      if (newWidth < MIN_WIDTH) {
        newWidth = MIN_WIDTH;
        newHeight = newWidth / aspectRatio;
      }
      if (newHeight < MIN_HEIGHT) {
        newHeight = MIN_HEIGHT;
        newWidth = newHeight * aspectRatio; // Potentially overrides previous newWidth
      }
      // Final check in case the second adjustment made the first dimension too small
      if (newWidth < MIN_WIDTH) {
        newWidth = MIN_WIDTH;
        newHeight = newWidth / aspectRatio;
      }
       // Ensure results are numbers and adhere to minimums
      newWidth = Math.max(MIN_WIDTH, isNaN(newWidth) ? MIN_WIDTH : newWidth);
      newHeight = Math.max(MIN_HEIGHT, isNaN(newHeight) ? MIN_HEIGHT : newHeight);
    }

    // Position adjustments (must happen AFTER newWidth/newHeight are finalized)
    if (activeHandle.includes('w')) {
      newX = initialFrameRect.left + (initialFrameRect.width - newWidth);
    }
    if (isNorthHandle) {
      newY = initialFrameRect.top + (initialFrameRect.height - newHeight);
    }

    // Ensure newX + newWidth does not exceed window boundaries if needed,
    // but for now, we'll allow it to go off-screen as per typical overlay behavior.

    // Adjust position if width/height was clamped due to moving a 'w' or 'n' handle
    // This is now handled by the newX/newY calculations above which use the final newWidth/newHeight.

    updateFrameRect(newX, newY, newWidth, newHeight);
  }

  function handleResizeMouseUp() {
    if (isResizing) {
      isResizing = false;
      activeHandle = null;
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
      console.log('Frame resizing finalized.');
    }
  }

  function handleFrameMouseDown(event) {
    // Only start dragging if the mousedown is directly on framerMain,
    // not on its children (the handles)
    // AND it's a left-click
    if (event.button === 0 && event.target === framerMain) {
      isDraggingFrame = true;
      dragFrameStartX = event.clientX;
      dragFrameStartY = event.clientY;

      // Get current position from style (assuming it's set in pixels)
      initialFrameOffsetX = framerMain.offsetLeft;
      initialFrameOffsetY = framerMain.offsetTop;

      document.addEventListener('mousemove', handleFrameMouseMove);
      document.addEventListener('mouseup', handleFrameMouseUp);
    }
  }

  function handleFrameMouseMove(event) {
    if (!isDraggingFrame) return;

    const dx = event.clientX - dragFrameStartX;
    const dy = event.clientY - dragFrameStartY;

    const newX = initialFrameOffsetX + dx;
    const newY = initialFrameOffsetY + dy;

    updateFrameRect(newX, newY, framerMain.offsetWidth, framerMain.offsetHeight);
  }

  function handleFrameMouseUp() {
    if (isDraggingFrame) {
      isDraggingFrame = false;
      document.removeEventListener('mousemove', handleFrameMouseMove);
      document.removeEventListener('mouseup', handleFrameMouseUp);
      console.log('Frame dragging finalized.');
    }
  }
  body.addEventListener('mousedown', handleBodyMouseDown);

  if (framerMain) {
    console.log('Framer main element found:', framerMain);

    const resizeHandles = [
      'handle-nw', 'handle-n', 'handle-ne',
      'handle-w', 'handle-e',
      'handle-sw', 'handle-s', 'handle-se'
    ];

    resizeHandles.forEach(id => {
      const handle = document.getElementById(id);
      if (handle) {
        handle.addEventListener('mousedown', handleResizeMouseDown);
      } else {
        console.error(`Resize handle #${id} not found!`);
      }
    });

    // Add mousedown listener for dragging the frame itself
    framerMain.addEventListener('mousedown', handleFrameMouseDown);

    // Ensure the frame is visible and set its initial size and position.
    framerMain.style.display = 'block'; 
    updateFrameRect(100, 100, 300, 200); // Or use window.innerWidth/Height to center

  } else {
    console.error('CRITICAL: Framer main element (#framer-main) not found!');
  }
});