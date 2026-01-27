// @ts-check
import { defineConfig, envField } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [vue()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['mp-astro.px.com.ar', 'localhost', '127.0.0.1']
    }
  },
  env: {
    schema: {
      IS_PROD: envField.boolean({ context: "client", access: "public", optional: true }),
      ADMIN_NAME: envField.string({ context: "server", access: "secret" }),
      ADMIN_EMAIL: envField.string({ context: "server", access: "secret" }),
      ADMIN_PASSWORD: envField.string({ context: "server", access: "secret" }),
      JWT_SECRET: envField.string({ context: "server", access: "secret" }),
      DB_HOST: envField.string({ context: "server", access: "secret", default: "127.0.0.1" }),
      DB_USER: envField.string({ context: "server", access: "secret", default: "root" }),
      DB_PASSWORD: envField.string({ context: "server", access: "secret", default: "" }),
      DB_NAME: envField.string({ context: "server", access: "secret", default: "catbycam" }),
    }
  }
});