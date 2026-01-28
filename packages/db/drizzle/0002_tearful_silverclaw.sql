ALTER TABLE "assignments" DROP CONSTRAINT "assignments_dirigente_id_managers_id_fk";
--> statement-breakpoint
ALTER TABLE "territories" ALTER COLUMN "blocks" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "manager_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_manager_id_managers_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" DROP COLUMN "dirigente_id";