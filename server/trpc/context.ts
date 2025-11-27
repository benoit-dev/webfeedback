export async function createContext(opts: { req: Request; resHeaders: Headers }) {
  return {
    // Add any context you need here (e.g., database, auth)
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

