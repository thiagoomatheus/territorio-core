CREATE TYPE "public"."status" AS ENUM('disponivel', 'trabalhando');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('rural', 'comercial', 'urbano');--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"congregation_id" uuid NOT NULL,
	"territory_id" uuid NOT NULL,
	"dirigente_id" uuid NOT NULL,
	"status" text DEFAULT 'ativo',
	"started_at" timestamp DEFAULT now(),
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "congregations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"number" numeric NOT NULL,
	"whatsapp_instance_name" text,
	"whatsapp_api_key" text,
	"whatsapp_group_id" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "congregations_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "managers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"congregation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "territories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"congregation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"number" numeric NOT NULL,
	"blocks" jsonb NOT NULL,
	"type" "type" NOT NULL,
	"image_url" text,
	"obs" text,
	"status" "status" DEFAULT 'disponivel' NOT NULL,
	"last_worked_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"congregation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_congregation_id_congregations_id_fk" FOREIGN KEY ("congregation_id") REFERENCES "public"."congregations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_territory_id_territories_id_fk" FOREIGN KEY ("territory_id") REFERENCES "public"."territories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_dirigente_id_managers_id_fk" FOREIGN KEY ("dirigente_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managers" ADD CONSTRAINT "managers_congregation_id_congregations_id_fk" FOREIGN KEY ("congregation_id") REFERENCES "public"."congregations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "territories" ADD CONSTRAINT "territories_congregation_id_congregations_id_fk" FOREIGN KEY ("congregation_id") REFERENCES "public"."congregations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_congregation_id_congregations_id_fk" FOREIGN KEY ("congregation_id") REFERENCES "public"."congregations"("id") ON DELETE no action ON UPDATE no action;