import { Inngest } from "inngest";

// Create a client
export const inngest = new Inngest({
  id: "cromo-app",
  isDev: process.env.NODE_ENV === "development",
});