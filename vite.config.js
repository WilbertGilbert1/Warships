import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: './Client/index.html'   
    }
  }
})