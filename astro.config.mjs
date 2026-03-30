import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Your main URL
  site: 'https://edushastra.github.io',

  // Leave this as an empty string for a User Site (edushastra.github.io)
  base: '', 
  
  vite: {
    plugins: [tailwindcss()],
  },
});
