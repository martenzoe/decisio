// tailwind.config.js
export default {
    darkMode: 'class',
    content: [
      './index.html',
      './src/**/*.{js,jsx}',       // <- deine React-Komponenten
      './src/**/*.css',            // <- ganz wichtig: damit er deine dark:bg-* in CSS-Dateien findet
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }
  