import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { getPresignedUploadUrl } from "@territorio/server/services/storage";

export const storageRouter = router({
  
    getUploadUrl: protectedProcedure
    .input(z.object({
        filename: z.string(),
        contentType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
        
        const { uploadUrl, finalUrl } = await getPresignedUploadUrl(
            input.filename, 
            ctx.user.congregationId
        );

        return {
            uploadUrl,
            finalUrl
        };
    }),

});