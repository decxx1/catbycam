import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { createPool } from "mysql2/promise";
import "dotenv/config";

const pool = createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "catbycam",
  port: Number(process.env.DB_PORT) || 3306,
  timezone: "Z",
});

export default betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4321",
  secret: process.env.BETTER_AUTH_SECRET,
  
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
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
