import { defineConfig } from 'cypress'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  e2e: {
    baseUrl: 'https://reqres.in',
    setupNodeEvents(on, config) {
      config.env.api = process.env.API_KEY || ''
      return config
    }
  }
})
