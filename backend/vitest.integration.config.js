import { defineConfig, loadEnv } from 'vite';

// Carga backend/.env real (sin imprimirlo). Solo corre tests/integration/**
export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.js'],
    env: loadEnv(mode, process.cwd(), ''),
    testTimeout: 120000,
    hookTimeout: 120000,
  },
}));
