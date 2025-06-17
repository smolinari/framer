import { ref } from 'vue';
import { currentMonitor as getCurrentMonitor } from '@tauri-apps/api/window';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { info as logInfo, error as logError } from '@tauri-apps/plugin-log';

export function useMonitorAndScaling() {
  const monitorPhysicalWidth = ref(window.innerWidth); // Fallback
  const monitorPhysicalHeight = ref(window.innerHeight); // Fallback
  const monitorScaleFactor = ref(1); // OS level scale factor
  const appliedAppZoom = ref(1.0); // Zoom applied to the webview

  async function fetchMonitorAndApplyScaling() {
    try {
      await logInfo("useMonitorAndScaling: Fetching monitor info and applying scaling...");

      let tauriMonitorInfoAvailable = false;
      let tauriReportedScaleFactor: number | undefined;

      try {
        const tauriMonitor = await getCurrentMonitor();
        if (tauriMonitor && tauriMonitor.size && typeof tauriMonitor.size.width === 'number' && typeof tauriMonitor.size.height === 'number' && typeof tauriMonitor.scaleFactor === 'number' && tauriMonitor.scaleFactor > 0) {
          monitorPhysicalWidth.value = tauriMonitor.size.width;
          monitorPhysicalHeight.value = tauriMonitor.size.height;
          tauriReportedScaleFactor = tauriMonitor.scaleFactor;
          tauriMonitorInfoAvailable = true;
          await logInfo(`useMonitorAndScaling: Using Tauri Monitor Info - Physical Size: ${monitorPhysicalWidth.value}x${monitorPhysicalHeight.value}, ScaleFactor: ${tauriReportedScaleFactor}`);
        } else {
          await logInfo("useMonitorAndScaling: Tauri Monitor Info not available or invalid.");
        }
      } catch (e) {
        await logError(`useMonitorAndScaling: Could not get Tauri monitor info: ${e}`);
      }

      const initialDevicePixelRatio = window.devicePixelRatio || 1;

      if (tauriMonitorInfoAvailable && tauriReportedScaleFactor) {
        monitorScaleFactor.value = tauriReportedScaleFactor;
      } else {
        monitorScaleFactor.value = initialDevicePixelRatio;
        const logicalScreenWidth = screen.width;
        const logicalScreenHeight = screen.height;
        monitorPhysicalWidth.value = Math.round(logicalScreenWidth * monitorScaleFactor.value);
        monitorPhysicalHeight.value = Math.round(logicalScreenHeight * monitorScaleFactor.value);
        await logInfo(`useMonitorAndScaling: Using Fallback - Calculated Monitor Physical Size: ${monitorPhysicalWidth.value}x${monitorPhysicalHeight.value}`);
      }
      await logInfo(`useMonitorAndScaling: Effective OS Scale Factor: ${monitorScaleFactor.value}`);

      if (monitorScaleFactor.value !== 1.0) {
        const theoreticalZoom = 1.0 / monitorScaleFactor.value;
        const empiricalCorrectionFactor = 1.3820904113504174;
        appliedAppZoom.value = theoreticalZoom / empiricalCorrectionFactor;
        const currentAppWebview = getCurrentWebview();
        await currentAppWebview.setZoom(appliedAppZoom.value);
        await logInfo(`useMonitorAndScaling: Applied initial zoom: ${appliedAppZoom.value}`);
      } else {
        appliedAppZoom.value = 1.0;
        await logInfo(`useMonitorAndScaling: No zoom applied as monitorScaleFactor is 1.0`);
      }
    } catch (error) {
      await logError(`useMonitorAndScaling: Error during monitor/scaling setup: ${error}`);
      // Fallback to defaults if any error occurs
      monitorScaleFactor.value = window.devicePixelRatio || 1;
      monitorPhysicalWidth.value = Math.round(window.innerWidth * monitorScaleFactor.value);
      monitorPhysicalHeight.value = Math.round(window.innerHeight * monitorScaleFactor.value);
      appliedAppZoom.value = 1.0;
    }
  }

  return {
    monitorPhysicalWidth,
    monitorPhysicalHeight,
    monitorScaleFactor,
    appliedAppZoom,
    fetchMonitorAndApplyScaling,
  };
}