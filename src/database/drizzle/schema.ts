import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const widgetCustomers = pgTable('widget_customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  githubToken: text('github_token').notNull(), // Will be encrypted
  githubOwner: varchar('github_owner', { length: 255 }).notNull(),
  githubRepo: varchar('github_repo', { length: 255 }).notNull(),
  allowedDomains: jsonb('allowed_domains').$type<string[]>().notNull().default([]),
  config: jsonb('config').$type<Record<string, unknown>>().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type WidgetCustomer = typeof widgetCustomers.$inferSelect;
export type NewWidgetCustomer = typeof widgetCustomers.$inferInsert;

