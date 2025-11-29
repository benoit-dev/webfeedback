import { router, publicProcedure } from '@/lib/trpc/server';
import { createContext } from './context';
import { z } from 'zod';
import { database } from '@/src/database';
import { widgetCustomers } from '@/src/database/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateApiKey, isValidApiKey } from '@/lib/widget/generate-key';
import { normalizeDomain } from '@/lib/widget/domain-validation';

// Helper function to normalize URL to pathname + search for comparison
function normalizeUrlForComparison(url: string): string {
  try {
    // If it's already a pathname (starts with /), return as is
    if (url.startsWith('/')) {
      return url;
    }
    // If it's a full URL, extract pathname + search
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    // If URL parsing fails, try to extract pathname manually
    const match = url.match(/\/\/[^\/]+(\/.*?)(?:\?|$)/);
    return match ? match[1] : url;
  }
}

// Helper function to get the base URL for widget script tags
function getWidgetBaseUrl(): string {
  // Check for explicit production URL
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }

  // Check for Vercel URL (automatically set by Vercel)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // Throw an error if no URL is configured
  throw new Error(
      'NEXT_PUBLIC_URL or NEXT_PUBLIC_VERCEL_URL must be set. Please set NEXT_PUBLIC_URL to your domain (e.g., https://yourdomain.com)'
    );
}

export const appRouter = router({
  // Example: health check
  health: publicProcedure.query(() => {
    return { status: 'ok' };
  }),

  // Widget customer management procedures
  widget: router({
    customers: router({
      create: publicProcedure
        .input(
          z.object({
            name: z.string().min(1, 'Name is required'),
            githubToken: z.string().min(1, 'GitHub token is required'),
            githubOwner: z.string().min(1, 'GitHub owner is required'),
            githubRepo: z.string().min(1, 'GitHub repo is required'),
            allowedDomains: z.array(z.string()).min(1, 'At least one domain is required'),
            config: z.record(z.string(), z.unknown()).optional(),
          })
        )
        .mutation(async ({ input }) => {
          // Normalize domains
          const normalizedDomains = input.allowedDomains.map(domain => normalizeDomain(domain));

          // Generate unique API key
          let apiKey: string;
          let isUnique = false;
          let attempts = 0;
          const maxAttempts = 10;

          while (!isUnique && attempts < maxAttempts) {
            apiKey = generateApiKey();
            const existing = await database
              .select()
              .from(widgetCustomers)
              .where(eq(widgetCustomers.apiKey, apiKey))
              .limit(1);
            
            if (existing.length === 0) {
              isUnique = true;
            }
            attempts++;
          }

          if (!isUnique) {
            throw new Error('Failed to generate unique API key after multiple attempts');
          }

          // Create customer record
          const [customer] = await database
            .insert(widgetCustomers)
            .values({
              apiKey: apiKey!,
              name: input.name,
              githubToken: input.githubToken, // TODO: Encrypt this
              githubOwner: input.githubOwner,
              githubRepo: input.githubRepo,
              allowedDomains: normalizedDomains,
              config: input.config || {},
              isActive: true,
            })
            .returning();

          // Generate script tag HTML
          const baseUrl = getWidgetBaseUrl();
          const scriptTag = `<script src="${baseUrl}/widget/v1/loader.js?key=${customer.apiKey}"></script>`;

          return {
            id: customer.id,
            apiKey: customer.apiKey,
            name: customer.name,
            scriptTag,
          };
        }),

      list: publicProcedure.query(async () => {
        const customers = await database
          .select({
            id: widgetCustomers.id,
            apiKey: widgetCustomers.apiKey,
            name: widgetCustomers.name,
            githubOwner: widgetCustomers.githubOwner,
            githubRepo: widgetCustomers.githubRepo,
            allowedDomains: widgetCustomers.allowedDomains,
            isActive: widgetCustomers.isActive,
            createdAt: widgetCustomers.createdAt,
            updatedAt: widgetCustomers.updatedAt,
          })
          .from(widgetCustomers)
          .orderBy(desc(widgetCustomers.createdAt));

        return customers;
      }),

      getByKey: publicProcedure
        .input(z.object({ apiKey: z.string() }))
        .query(async ({ input }) => {
          if (!isValidApiKey(input.apiKey)) {
            throw new Error('Invalid API key format');
          }

          const [customer] = await database
            .select()
            .from(widgetCustomers)
            .where(eq(widgetCustomers.apiKey, input.apiKey))
            .limit(1);

          if (!customer) {
            throw new Error('Customer not found');
          }

          // Don't return sensitive GitHub token
          const { githubToken, ...safeCustomer } = customer;
          return safeCustomer;
        }),

      update: publicProcedure
        .input(
          z.object({
            id: z.string().uuid(),
            name: z.string().optional(),
            githubToken: z.string().optional(),
            githubOwner: z.string().optional(),
            githubRepo: z.string().optional(),
            allowedDomains: z.array(z.string()).optional(),
            config: z.record(z.string(), z.unknown()).optional(),
            isActive: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, allowedDomains, ...updateData } = input;

          const updateValues: Partial<typeof widgetCustomers.$inferInsert> = {
            ...updateData,
            updatedAt: new Date(),
          };

          // Normalize domains if provided
          if (allowedDomains) {
            updateValues.allowedDomains = allowedDomains.map(domain => normalizeDomain(domain));
          }

          const [updated] = await database
            .update(widgetCustomers)
            .set(updateValues)
            .where(eq(widgetCustomers.id, id))
            .returning();

          if (!updated) {
            throw new Error('Customer not found');
          }

          // Don't return sensitive GitHub token
          const { githubToken, ...safeCustomer } = updated;
          return safeCustomer;
        }),

      deactivate: publicProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ input }) => {
          const [updated] = await database
            .update(widgetCustomers)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(widgetCustomers.id, input.id))
            .returning();

          if (!updated) {
            throw new Error('Customer not found');
          }

          return { success: true, id: updated.id };
        }),

      generateScriptTag: publicProcedure
        .input(z.object({ apiKey: z.string() }))
        .query(async ({ input }) => {
          if (!isValidApiKey(input.apiKey)) {
            throw new Error('Invalid API key format');
          }

          const baseUrl = getWidgetBaseUrl();
          return `<script src="${baseUrl}/widget/v1/loader.js?key=${input.apiKey}"></script>`;
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;

