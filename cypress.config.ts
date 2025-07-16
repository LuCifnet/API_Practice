import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
const mochawesome = require('cypress-mochawesome-reporter/plugin');
const { beforeRunHook, afterRunHook } = require('cypress-mochawesome-reporter/lib');

dotenv.config();

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    overwrite: false,
    html: true,
    json: true,
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
  },
  e2e: {
    baseUrl: 'https://gorest.co.in',
    setupNodeEvents(on, config) {
      // Register mochawesome plugin
      mochawesome(on);

      // Optional lifecycle hooks for extended reporting
      on('before:run', async (details) => {
        console.log('Running before:run hook');
        await beforeRunHook(details);
      });

      on('after:run', async () => {
        console.log('Running after:run hook');
        await afterRunHook();
      });

      // Inject environment variable from .env
      config.env.token = process.env.GOREST_API_TOKEN || '';
      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.ts'
  }
});
