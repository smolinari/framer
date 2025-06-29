<script setup>
import { ref, onMounted } from 'vue';

const checksumsData = ref(null);
const copyStatus = ref({});

// A map to provide user-friendly names and details
const downloadPlatforms = {
  windows_x64_msi: { name: 'Windows (x64)', type: 'MSI Installer' },
  linux_amd64_deb: { name: 'Linux (amd64)', type: 'DEB Package' },
  linux_amd64_appimage: { name: 'Linux (amd64)', type: 'AppImage' },
};

onMounted(async () => {
  try {
    const response = await fetch('/downloads/checksums.json');
    if (!response.ok) throw new Error('Failed to fetch checksums');
    checksumsData.value = await response.json();
  } catch (error) {
    console.error(error);
  }
});

async function copyToClipboard(text, key) {
  try {
    await navigator.clipboard.writeText(text);
    copyStatus.value[key] = 'Copied!';
    setTimeout(() => {
      copyStatus.value[key] = 'Copy';
    }, 2000);
  } catch (err) {
    copyStatus.value[key] = 'Failed';
    console.error('Failed to copy text: ', err);
  }
}
</script>

<template>
  <div class="download-table-container" v-if="checksumsData">
    <div class="vp-doc">
      <table>
        <thead>
          <tr>
            <th>Platform</th>
            <th>Package Type</th>
            <th>Filename</th>
            <th>SHA256 Checksum</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(details, key) in checksumsData.downloads" :key="key">
            <td>{{ downloadPlatforms[key]?.name || key }}</td>
            <td>{{ downloadPlatforms[key]?.type || 'File' }}</td>
            <td><code>{{ details.filename }}</code></td>
            <td class="checksum-cell">
              <code class="checksum-value">{{ details.sha256 }}</code>
              <button @click="copyToClipboard(details.sha256, key)" class="copy-button" :aria-label="`Copy checksum for ${details.filename}`">
                {{ copyStatus[key] || 'Copy' }}
              </button>
            </td>
            <td>
              <a :href="`/downloads/${details.filename}`" class="VpButton small brand" download>
                Download
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else>
    <p>Loading download options...</p>
  </div>
</template>

<style scoped>
.download-table-container {
  margin-top: 24px;
}

.checksum-cell {
  position: relative;
  overflow: hidden;
}

.checksum-value {
  display: block;
  font-family: var(--vp-font-family-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px; /* Adjust based on your preference */
}

/* VitePress table styles are applied via .vp-doc wrapper */
.vp-doc table {
  display: table;
  width: 100%;
  min-width: 100%;
}
</style>