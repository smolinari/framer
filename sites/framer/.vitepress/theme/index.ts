// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css' // Import your custom CSS
import MyLayout from './Layout.vue'

export default {
  ...DefaultTheme,
  // You can enhance the theme here if needed
  Layout: MyLayout,
}