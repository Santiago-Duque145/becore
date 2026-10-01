import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
    exclude: ['tests/integration/**', 'node_modules/**'],
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      FRONTEND_URL: 'http://localhost:5173',
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SECRET_KEY: 'test-secret-key',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: '',
      SMTP_PASS: '',
      MAIL_FROM: '',
      REMINDER_HOURS_BEFORE: '24',
      CRON_ENABLED: 'false',
    },
  },
});
