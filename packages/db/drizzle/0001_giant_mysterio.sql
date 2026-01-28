ALTER TABLE "congregations" ALTER COLUMN "number" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "territories" ALTER COLUMN "number" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "congregation_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "congregations" ADD COLUMN "setup_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text;