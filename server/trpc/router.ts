import { router, publicProcedure } from '@/lib/trpc/server';
import { createContext } from './context';
import { z } from 'zod';

// Placeholder router - we'll add GitHub procedures later if needed
export const appRouter = router({
  // Example: health check
  health: publicProcedure.query(() => {
    return { status: 'ok' };
  }),
});

export type AppRouter = typeof appRouter;

