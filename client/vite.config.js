/**
 * @file vite.config.js
 * @description Vite configuration file for Valora ERP frontend client.
 * Configures the build pipeline, dev server, and React JSX fast refresh plugin.
 * @module vite.config
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite project configuration options.
 * @see https://vite.dev/config/
 */
export default defineConfig({
  plugins: [react()],
});

