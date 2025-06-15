console.log("Renderer.js loaded - Top of file.");
// console.log("Renderer.js: Top-level check for window.__TAURI__:", window.__TAURI__); // Can be removed, checked in DOMContentLoaded

document.addEventListener('DOMContentLoaded', async () => {
  console.log("Renderer.js: DOMContentLoaded event fired.");
  // console.log("Renderer.js: DOMContentLoaded - check for window.__TAURI__:", window.__TAURI__); // Redundant if checked above or if __TAURI__ is reliably present
  
  const framerMain = document.getElementById('framer-main');
  const body = document.body;
  const toggleButton = document.getElementById('toggle-frame-btn');
  const dimensionDisplay = document.getElementById('dimension-display');
  let appWindow = null; 

  let isFrameActive = true; // Start with the frame ON
  let isDrawing = false;
  let isResizing = false;
  let isDraggingFrame = false;
  let activeHandle = null;

  let drawStartX, drawStartY;
  let resizeStartX, resizeStartY;
  let dragFrameStartX, dragFrameStartY;
  let initialFrameOffsetX, initialFrameOffsetY;
  let initialFrameRect = {};

  // Min dimensions for the frame
  const MIN_WIDTH = 20; // e.g., 20px
  const MIN_HEIGHT = 20; // e.g., 20px
  const CONTROL_AREA_HEIGHT = 50; // Effective height of the control button area

  // Attempt to get appWindow and set up event listener from Tauri
  if (window.__TAURI__) {
    console.log("Renderer.js: window.__TAURI__ is available.");
    const { getCurrentWindow } = window.__TAURI__.window; // Destructure for cleaner access

    // Based on the logged keys, getCurrentWindow() should be directly on window.__TAURI__.window
    if (window.__TAURI__.window) {
      if (typeof getCurrentWindow === 'function') {
        try {
          appWindow = getCurrentWindow(); // Assign first
          if (appWindow) { // Then check if appWindow is truthy
            await appWindow.setIgnoreCursorEvents(false); // Ensure interactive for the button
            console.log("Renderer.js: Tauri appWindow object assigned and set to interactive.");
          }
          else {
            console.error("Renderer.js: .window.getCurrentWindow() returned a falsy value.");
          }
        } catch (e) {
          console.error("Renderer.js: Error calling .window.getCurrentWindow():", e);
        }
      } else {
        console.error("Renderer.js: .window.getCurrentWindow is NOT a function on window.__TAURI__.window.");
        // console.log("window.__TAURI__.window keys:", Object.keys(window.__TAURI__.window)); // Can be verbose
      }
    } else {
      console.error("Renderer.js: window.__TAURI__.window object itself is NOT available.");
    }

  } else {
    console.error("Renderer.js: CRITICAL - window.__TAURI__ is NOT available at the point of API access.");
  }

  // Function to update frame's position and dimensions
  function updateFrameRect(x, y, width, height) {
    if (framerMain) {
      // Constrain frame's top position
      const constrainedY = Math.max(CONTROL_AREA_HEIGHT, y);
      const constrainedHeight = (y < CONTROL_AREA_HEIGHT) ? Math.max(0, height - (CONTROL_AREA_HEIGHT - y)) : height;

      framerMain.style.left = `${x}px`;
      framerMain.style.top = `${constrainedY}px`;
      framerMain.style.width = `${width}px`;
      framerMain.style.height = `${constrainedHeight}px`;

      // Ensure height doesn't become negative if constrainedY pushes it too far
      if (constrainedY + parseFloat(framerMain.style.height) > window.innerHeight) {
          framerMain.style.height = `${Math.max(0, window.innerHeight - constrainedY)}px`;
      }
    }
  }

  function updateDimensionDisplayPosition() {
    if (framerMain && dimensionDisplay && dimensionDisplay.style.display === 'block') {
      const frameRect = framerMain.getBoundingClientRect();
      const displayRect = dimensionDisplay.getBoundingClientRect(); // Get its current size to offset correctly

      // Position at bottom-right of the frame, with a small offset inwards
      let displayTop = frameRect.bottom - displayRect.height - 5; // 5px offset from frame bottom
      let displayLeft = frameRect.right - displayRect.width - 5;  // 5px offset from frame right

      // Ensure it doesn't go off-screen if frame is too small or near edge
      displayTop = Math.max(0, Math.min(displayTop, window.innerHeight - displayRect.height));
      displayLeft = Math.max(0, Math.min(displayLeft, window.innerWidth - displayRect.width));

      dimensionDisplay.style.top = `${displayTop}px`;
      dimensionDisplay.style.left = `${displayLeft}px`;
    }
  }

  function showFrame() {
    if (!framerMain) return;

    const hasExistingFrame = framerMain.style.left !== "" && 
                             (parseInt(framerMain.style.width, 10) > 0 || parseInt(framerMain.style.height, 10) > 0);

    let currentWidth, currentHeight;

    if (hasExistingFrame) {
        console.log("Renderer.js: Showing existing frame.");
        framerMain.style.display = 'block';
        currentWidth = parseInt(framerMain.style.width, 10);
        currentHeight = parseInt(framerMain.style.height, 10);
    } else {
        console.log("Renderer.js: No valid previous frame. Creating and displaying a default frame.");
        const defaultX = 100;
        const defaultY = CONTROL_AREA_HEIGHT + 50;
        currentWidth = 300;
        currentHeight = 200;
        updateFrameRect(defaultX, defaultY, currentWidth, currentHeight);
        console.log(`Renderer.js: Default frame rect updated. Style left: ${framerMain.style.left}, top: ${framerMain.style.top}, width: ${framerMain.style.width}, height: ${framerMain.style.height}`);
        
        // Force a reflow to ensure the browser acknowledges the new dimensions
        // before we try to make it visible. Reading offsetHeight is a common way.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = framerMain.offsetHeight; 
        console.log(`Renderer.js: Reflow triggered. offsetHeight read as: ${framerMain.offsetHeight}`);

        console.log(`Renderer.js: Before setting display to block, current display is: "${framerMain.style.display}"`);
        framerMain.style.display = 'block';
        console.log(`Renderer.js: After setting display to block, current display is: "${framerMain.style.display}", offsetWidth: ${framerMain.offsetWidth}, offsetHeight: ${framerMain.offsetHeight}`);
    }

    if (dimensionDisplay) {
        dimensionDisplay.textContent = `w: ${Math.round(currentWidth)}px h: ${Math.round(currentHeight)}px`;
        dimensionDisplay.style.display = 'block';
        updateDimensionDisplayPosition(); 
    }
    console.log("Renderer.js: Frame is ON.");
}

function hideFrame() {
    if (framerMain) framerMain.style.display = 'none';
    if (dimensionDisplay) dimensionDisplay.style.display = 'none';
    console.log("Renderer.js: Frame is OFF.");
}
  function updateButtonText() {
    if (toggleButton) {
        toggleButton.textContent = `Frame ${isFrameActive ? 'ON' : 'OFF'}`;
    }
  }

  function handleBodyMouseDown(event) {
    if (event.button === 0 && event.target === body && isFrameActive && event.clientY >= CONTROL_AREA_HEIGHT) {
      isDrawing = true;
      drawStartX = event.clientX;
      drawStartY = event.clientY;

      const initialDrawY = Math.max(CONTROL_AREA_HEIGHT, drawStartY);
      updateFrameRect(drawStartX, initialDrawY, 0, 0);
      if (dimensionDisplay) {
        dimensionDisplay.textContent = `w: 0px h: 0px`;
        dimensionDisplay.style.display = 'block';
        console.log("Renderer.js: handleBodyMouseDown - dimensionDisplay shown");
        updateDimensionDisplayPosition(); // Position it
      }
      if (framerMain) { // Show framerMain after dimensionDisplay is set to block
        framerMain.style.display = 'block';
      }
      document.addEventListener('mousemove', handleBodyMouseMove);
      document.addEventListener('mouseup', handleBodyMouseUp);
    } else if (event.target === body && !isFrameActive) {
        console.log("Renderer.js: Frame is OFF. Click on body ignored.");
    }
  }

  function handleBodyMouseMove(event) {
    if (!isDrawing) return;

    const currentX = event.clientX;
    const currentY = event.clientY;

    const newX = Math.min(drawStartX, currentX);
    const newY = Math.max(CONTROL_AREA_HEIGHT, Math.min(drawStartY, currentY));
    const newWidth = Math.abs(currentX - drawStartX);
    const newHeight = Math.abs(currentY - newY); 
    
    updateFrameRect(newX, newY, newWidth, newHeight);

    // Update text if dimensionDisplay is visible
    if (dimensionDisplay) { // No need to check display style, if it's meant to be shown, it will be.
        dimensionDisplay.textContent = `w: ${Math.round(newWidth)}px h: ${Math.round(newHeight)}px`;
        updateDimensionDisplayPosition(); // Update position
    }
  }

  function handleBodyMouseUp() {
    if (isDrawing) {
      isDrawing = false;
      document.removeEventListener('mousemove', handleBodyMouseMove);
      document.removeEventListener('mouseup', handleBodyMouseUp);
      if (dimensionDisplay) {
        dimensionDisplay.style.display = 'none';
        console.log("Renderer.js: handleBodyMouseUp - dimensionDisplay hidden");
      }
    }
  }

  function handleResizeMouseDown(event) {
    if (event.button !== 0) return;

    event.stopPropagation(); 
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
    
    if (dimensionDisplay) {
      dimensionDisplay.textContent = `w: ${Math.round(initialFrameRect.width)}px h: ${Math.round(initialFrameRect.height)}px`;
      dimensionDisplay.style.display = 'block';
      console.log("Renderer.js: handleResizeMouseDown - dimensionDisplay shown");
      updateDimensionDisplayPosition(); // Position it
    }
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

    if (activeHandle.includes('e')) { 
      newWidth = Math.max(MIN_WIDTH, initialFrameRect.width + dx);
    }
    if (activeHandle.includes('w')) { 
      newWidth = Math.max(MIN_WIDTH, initialFrameRect.width - dx);
      newX = initialFrameRect.left + dx;
      if (initialFrameRect.width - dx < MIN_WIDTH) {
        newX = initialFrameRect.left + initialFrameRect.width - MIN_WIDTH;
      }
    }
    if (activeHandle.includes('s')) { 
      newHeight = Math.max(MIN_HEIGHT, initialFrameRect.height + dy);
    }

    const isNorthHandle = activeHandle === 'handle-n' || activeHandle === 'handle-nw' || activeHandle === 'handle-ne';

    if (isNorthHandle && !event.ctrlKey) { 
      newHeight = Math.max(MIN_HEIGHT, initialFrameRect.height - dy);
    }

    if (event.ctrlKey && initialFrameRect.width > 0 && initialFrameRect.height > 0) {
      const aspectRatio = initialFrameRect.width / initialFrameRect.height;
      let proposedW = initialFrameRect.width;
      let proposedH = initialFrameRect.height;

      if (activeHandle.includes('e')) { proposedW = initialFrameRect.width + dx; }
      if (activeHandle.includes('w')) { proposedW = initialFrameRect.width - dx; }
      if (activeHandle.includes('s')) { proposedH = initialFrameRect.height + dy; }
      if (activeHandle.includes('n')) { proposedH = initialFrameRect.height - dy; }

      const changedW = activeHandle.includes('e') || activeHandle.includes('w');
      const changedH = activeHandle.includes('n') || activeHandle.includes('s');

      if (changedW && (!changedH || Math.abs(dx / (initialFrameRect.width || 1)) >= Math.abs(dy / (initialFrameRect.height || 1)))) {
        newWidth = proposedW;
        newHeight = newWidth / aspectRatio;
      } else if (changedH) {
        newHeight = proposedH;
        newWidth = newHeight * aspectRatio;
      } else { 
        newWidth = proposedW;
        newHeight = proposedH;
      }

      if (newWidth < MIN_WIDTH) {
        newWidth = MIN_WIDTH;
        newHeight = newWidth / aspectRatio;
      }
      if (newHeight < MIN_HEIGHT) {
        newHeight = MIN_HEIGHT;
        newWidth = newHeight * aspectRatio; 
      }
      if (newWidth < MIN_WIDTH) {
        newWidth = MIN_WIDTH;
        newHeight = newWidth / aspectRatio;
      }
      newWidth = Math.max(MIN_WIDTH, isNaN(newWidth) ? MIN_WIDTH : newWidth);
      newHeight = Math.max(MIN_HEIGHT, isNaN(newHeight) ? MIN_HEIGHT : newHeight);
    }

    if (activeHandle.includes('w')) {
      newX = initialFrameRect.left + (initialFrameRect.width - newWidth);
    }
    if (isNorthHandle) {
      newY = initialFrameRect.top + (initialFrameRect.height - newHeight);
    }
    
    if (newY < CONTROL_AREA_HEIGHT) {
        newHeight -= (CONTROL_AREA_HEIGHT - newY); 
        newY = CONTROL_AREA_HEIGHT;
    }
    updateFrameRect(newX, newY, newWidth, newHeight);

    // Update text if dimensionDisplay is visible
    if (dimensionDisplay) {
        dimensionDisplay.textContent = `w: ${Math.round(newWidth)}px h: ${Math.round(newHeight)}px`;
        updateDimensionDisplayPosition(); // Update position
    }
  }

  function handleResizeMouseUp() {
    if (isResizing) {
      isResizing = false;
      activeHandle = null;
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
      if (dimensionDisplay) {
        dimensionDisplay.style.display = 'none';
        console.log("Renderer.js: handleResizeMouseUp - dimensionDisplay hidden");
      }
    }
  }

  function handleFrameMouseDown(event) {
    if (event.button === 0 && event.target === framerMain) {
      isDraggingFrame = true;
      dragFrameStartX = event.clientX;
      dragFrameStartY = event.clientY;
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
    let newX = initialFrameOffsetX + dx;
    let newY = Math.max(CONTROL_AREA_HEIGHT, initialFrameOffsetY + dy); 
    updateFrameRect(newX, newY, framerMain.offsetWidth, framerMain.offsetHeight);
    updateDimensionDisplayPosition(); // Update position when frame is dragged
  }

  function handleFrameMouseUp() {
    if (isDraggingFrame) {
      isDraggingFrame = false;
      document.removeEventListener('mousemove', handleFrameMouseMove);
      document.removeEventListener('mouseup', handleFrameMouseUp);
    }
  }
  body.addEventListener('mousedown', handleBodyMouseDown);

  if (toggleButton) {
    updateButtonText(); 
    toggleButton.addEventListener('click', async () => {
        isFrameActive = !isFrameActive;
        updateButtonText();
        console.log(`Renderer.js: Toggle clicked. isFrameActive is now: ${isFrameActive}`);
        if (isFrameActive) {
            showFrame();
        } else {
            hideFrame();
        }
    });
  } else {
    console.error("Renderer.js: Toggle button not found!");
  }

  if (framerMain) {
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
    framerMain.addEventListener('mousedown', handleFrameMouseDown);
    framerMain.style.display = 'none'; 
  } else {
    console.error('CRITICAL: Framer main element (#framer-main) not found!');
  }

  // Initial state: Frame is ON. Window is interactive (set at the top of DOMContentLoaded).
  updateButtonText(); // Update button text to reflect initial "ON" state
  if (isFrameActive) {
    // Defer the initial showFrame call slightly to ensure DOM is fully ready for style changes
    setTimeout(() => {
        console.log("Renderer.js: Deferred initial showFrame call.");
        showFrame();
    }, 100); // setTimeout with 100ms delay
  }
});
