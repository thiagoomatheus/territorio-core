import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { getPresignedUploadUrl } from "../services/storage"; // Import relativo limpo!

export const storageRouter = router({
  
  getUploadUrl: protectedProcedure
  .input(z.object({
    filename: z.string(),
    contentType: z.string().optional(),
  }))
  .output(z.object({
    uploadUrl: z.string(),
    finalUrl: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      console.log("DEBUG: Iniciando geração de URL para", input.filename);
      
      // Verifique se o nome aqui é congregationId ou organizationId conforme seu contexto!
      const orgId = ctx.user.congregationId || (ctx.user as any).organizationId;
      
      if (!orgId) {
        console.error("DEBUG: organizationId está faltando no contexto!");
        throw new Error("ID da organização não encontrado no token");
      }

      const result = await getPresignedUploadUrl(input.filename, orgId);
      
      console.log("DEBUG: URL gerada com sucesso");
      return result;
    } catch (error: any) {
      // ISSO VAI MOSTRAR O ERRO REAL NO TERMINAL DO DOCKER
      console.error("❌ ERRO REAL NO STORAGE ROUTER:", error);
      throw error;
    }
  }),

});