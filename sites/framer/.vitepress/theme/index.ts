// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css' // Import your custom CSS
import MyLayout from './Layout.vue' // Your custom layout
import DownloadTable from './components/DownloadTable.vue'

export default {
  ...DefaultTheme,
  Layout: MyLayout,
  enhanceApp({ app }) {
    app.component('DownloadTable', DownloadTable)
  },
}