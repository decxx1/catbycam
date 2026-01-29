import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { createPool } from "mysql2/promise";
import bcrypt from "bcryptjs";

const pool = createPool({
  host: import.meta.env.DB_HOST || "127.0.0.1",
  user: import.meta.env.DB_USER || "root",
  password: import.meta.env.DB_PASSWORD || "",
  database: import.meta.env.DB_NAME || "catbycam",
  port: Number(import.meta.env.DB_PORT) || 3306,
  timezone: "Z",
});

export const auth = betterAuth({
  database: pool,
  baseURL: import.meta.env.BETTER_AUTH_URL || "http://localhost:4321",
  secret: import.meta.env.BETTER_AUTH_SECRET,
  
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day - update session if older than this
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // Users can't set their own role on signup
      },
    },
  },

  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
