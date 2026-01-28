import { pgTable, text, timestamp, boolean, uuid, jsonb, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const typeEnum = pgEnum('type', ['rural', 'comercial', 'urbano']);
export const statusEnum = pgEnum('status', ['disponivel', 'trabalhando']);

export const congregations = pgTable('congregations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  number: integer('number').unique().notNull(),
  whatsappInstanceName: text('whatsapp_instance_name'),
  whatsappApiKey: text('whatsapp_api_key'),
  whatsappGroupId: text('whatsapp_group_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  congregationId: uuid('congregation_id').references(() => congregations.id),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const managers = pgTable('managers', {
  id: uuid('id').defaultRandom().primaryKey(),
  congregationId: uuid('congregation_id').references(() => congregations.id).notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const territories = pgTable('territories', {
  id: uuid('id').defaultRandom().primaryKey(),
  congregationId: uuid('congregation_id').references(() => congregations.id).notNull(),
  name: text('name').notNull(),
  number: integer('number').notNull(),
  blocks: jsonb('blocks').notNull(),
  type: typeEnum('type').notNull(),
  imageUrl: text('image_url'),
  obs: text('obs'),
  status: statusEnum('status')
    .default('disponivel')
    .notNull(),
  lastWorkedAt: timestamp('last_worked_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  congregationId: uuid('congregation_id').references(() => congregations.id).notNull(),
  territoryId: uuid('territory_id').references(() => territories.id).notNull(),
  managerId: uuid('manager_id').references(() => managers.id).notNull(),
  status: text('status', { enum: ['ativo', 'concluido', 'cancelado'] }).default('ativo'),
  startedAt: timestamp('started_at').defaultNow(),
  finishedAt: timestamp('finished_at'),
});

export const congregationsRelations = relations(congregations, ({ many }) => ({
  users: many(users),
  managers: many(managers),
  territories: many(territories),
}));

export const usersRelations = relations(users, ({ one }) => ({
  congregation: one(congregations, {
    fields: [users.congregationId],
    references: [congregations.id],
  }),
}));

export const managersRelations = relations(managers, ({ one, many }) => ({
  congregation: one(congregations, {
    fields: [managers.congregationId],
    references: [congregations.id],
  }),
  assignments: many(assignments),
}));

export const territoriesRelations = relations(territories, ({ one, many }) => ({
  congregation: one(congregations, {
    fields: [territories.congregationId],
    references: [congregations.id],
  }),
  assignments: many(assignments),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  territory: one(territories, {
    fields: [assignments.territoryId],
    references: [territories.id],
  }),
  manager: one(managers, {
    fields: [assignments.managerId],
    references: [managers.id],
  }),
}));