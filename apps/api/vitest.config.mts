import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      SESSION_SECRET: 'test-session-secret',
      NODE_ENV: 'test',
      WEB_ORIGIN: 'http://localhost:5173',
    },
  },
});
