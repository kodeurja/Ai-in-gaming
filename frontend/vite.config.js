import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: './',
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                hub: resolve(__dirname, 'hub.html'),
                persona: resolve(__dirname, 'persona.html'),
                roadmap: resolve(__dirname, 'roadmap.html'),
                game_dashboard: resolve(__dirname, 'game_dashboard.html'),
                quiz_setup: resolve(__dirname, 'quiz_setup.html'),
                quiz: resolve(__dirname, 'quiz.html'),
                puzzle: resolve(__dirname, 'puzzle.html'),
            },
        },
    },
    server: {
        port: 5500,
    }
});
