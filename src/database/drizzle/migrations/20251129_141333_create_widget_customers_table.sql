CREATE TABLE "widget_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"github_token" text NOT NULL,
	"github_owner" varchar(255) NOT NULL,
	"github_repo" varchar(255) NOT NULL,
	"allowed_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "widget_customers_api_key_unique" UNIQUE("api_key")
);
