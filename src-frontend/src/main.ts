// import { getCurrentWindow } from '@tauri-apps/api/window'; // No longer needed for plain JS test
// import { info as logInfo, error as logError } from '@tauri-apps/plugin-log'; // No longer needed for plain JS test

import { createApp } from 'vue';
import { Quasar } from 'quasar';

// Import icon libraries
import '@quasar/extras/roboto-font-latin-ext/roboto-font-latin-ext.css';
import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/material-icons-sharp/material-icons-sharp.css';
// Import Quasar css
import 'quasar/src/css/index.sass';

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from './App.vue'

const myApp = createApp(App)
myApp.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here if needed
});

// Assumes you have a <div id="app"></div> in your index.html
myApp.mount('#app')