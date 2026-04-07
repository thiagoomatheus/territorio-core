import { useTRPC } from "@/utils/trpc"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import z from "zod"

const schema = z.object({
    password: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
})

export function useResetPassword(searchParams: URLSearchParams) {

    const trpc = useTRPC()

    const navigate = useNavigate()
    const token = searchParams.get("token")

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { password: "", confirmPassword: "" }
    })

    const mutation = useMutation(trpc.auth.resetPassword.mutationOptions({
        onSuccess: () => {
            toast.success("Senha alterada!", { description: "Sua nova senha já está valendo. Faça login." })
            navigate("/login")
        },
        onError: (err) => {
            toast.error("Erro", { description: err.message })
        }
    }))

    const onSubmit = (data: z.infer<typeof schema>) => {
        if (!token) {
            toast.error("Token inválido", { description: "O link de recuperação parece estar quebrado." })
            return
        }
        mutation.mutate({ token, newPassword: data.password })
    }

    return { form, onSubmit, token, isLoading: mutation.isPending }
}