import { ref } from 'vue';
import { getName as getAppName, getVersion as getAppVersion } from '@tauri-apps/api/app';
import { arch, platform, type as osTypeFn, version as osVersionFn } from '@tauri-apps/plugin-os';
import { info as logInfo, error as logError } from '@tauri-apps/plugin-log';

export function useAppSysInfo() {
  const appName = ref('Framer'); // Default before loading
  const appVersion = ref('Loading...'); // Default before loading
  const osArch = ref('');
  const osPlatform = ref('');
  const osType = ref('');
  const osVersionInfo = ref('');

  async function fetchAppSysInfo() {
    try {
      appName.value = await getAppName();
      appVersion.value = await getAppVersion();
      await logInfo(`useAppSysInfo: Fetched App Info - Name: ${appName.value}, Version: ${appVersion.value}`);

      osArch.value = arch();
      osPlatform.value = platform();
      osType.value = osTypeFn();
      osVersionInfo.value = osVersionFn();
      await logInfo(`useAppSysInfo: Fetched OS Info - Type: ${osType.value}, Platform: ${osPlatform.value}, Arch: ${osArch.value}, Version: ${osVersionInfo.value}`);
    } catch (error) {
      await logError(`useAppSysInfo: Error fetching app/system info: ${error}`);
      // Keep default/fallback values if fetching fails
    }
  }

  return {
    appName,
    appVersion,
    osArch,
    osPlatform,
    osType,
    osVersionInfo,
    fetchAppSysInfo,
  };
}