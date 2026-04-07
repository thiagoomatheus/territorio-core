import { router } from './trpc';
import { authRouter } from './router/auth';
import { congregationRouter } from './router/congregation';
import { territoryRouter } from './router/territory';
import { teamRouter } from './router/team';
import { assignmentRouter } from './router/assignments';
import { managersRouter } from './router/manager';
import { whatsappRouter } from './router/whatsapp';
import { storageRouter } from './router/storage';
import { dashboardRouter } from './router/dashboard';

export const appRouter = router({
  auth: authRouter,
  congregation: congregationRouter,
  territory: territoryRouter,
  team: teamRouter,
  assignment: assignmentRouter,
  managers: managersRouter,
  whatsapp: whatsappRouter,
  storage: storageRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
export { router, publicProcedure, protectedProcedure, authenticatedProcedure, type Context } from './trpc';
export { ensureBucketExists } from './services/storage';