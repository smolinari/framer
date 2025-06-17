// import { getCurrentWindow } from '@tauri-apps/api/window'; // No longer needed for plain JS test
// import { info as logInfo, error as logError } from '@tauri-apps/plugin-log'; // No longer needed for plain JS test

import { createApp } from 'vue'
// import { Quasar } from 'quasar' // Temporarily comment out

// Import icon libraries
// import '@quasar/extras/roboto-font-latin-ext/roboto-font-latin-ext.css' // Temporarily comment out
// import '@quasar/extras/material-icons/material-icons.css' // Temporarily comment out
// import '@quasar/extras/material-icons-sharp/material-icons-sharp.css' // Temporarily comment out
// Import Quasar css
// import 'quasar/src/css/index.sass' // Temporarily comment out

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from './App.vue'

const myApp = createApp(App)

// myApp.use(Quasar, { // Temporarily comment out
//   plugins: {}, // import Quasar plugins and add here
// })

// Assumes you have a <div id="app"></div> in your index.html
myApp.mount('#app')