import { vi, beforeEach } from "vitest";

// Route Handlers and dal.ts call next/headers' cookies() — mock it with an
// in-memory store so tests can "log in" by calling the real
// createSessionCookie() from src/lib/session.ts and have subsequent
// requireApiSession()/verifySession() calls read it back.
const store = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      store.has(name) ? { name, value: store.get(name)! } : undefined,
    set: (name: string, value: string) => {
      store.set(name, value);
    },
    delete: (name: string) => {
      store.delete(name);
    },
  }),
}));

beforeEach(() => {
  store.clear();
});
