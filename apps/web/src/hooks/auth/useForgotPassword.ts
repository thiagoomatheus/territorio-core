import { useTRPC } from "@/utils/trpc"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

const schema = z.object({
    email: z.email("E-mail inválido"),
})

export function useForgotPassword() {
    
    const trpc = useTRPC()
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: "" }
    })

    const mutation = useMutation(trpc.auth.forgotPassword.mutationOptions({
        onSuccess: () => {
            setIsSubmitted(true)
            toast.success("E-mail enviado!", { description: "Verifique sua caixa de entrada (ou o log do servidor)." })
        },
        onError: (err) => {
            toast.error("Erro ao enviar e-mail!", { description: err.message })
        }
    }))

    const onSubmit = (data: z.infer<typeof schema>) => {
        mutation.mutate(data)
    }

    return { form, onSubmit, isSubmitted, isLoading: mutation.isPending }
}