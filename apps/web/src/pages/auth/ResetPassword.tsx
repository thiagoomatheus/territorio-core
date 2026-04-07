import { Controller } from "react-hook-form"
import { useSearchParams } from "react-router-dom"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Loader2, Lock } from "lucide-react"
import { useResetPassword } from "@/hooks/auth/useResetPassword"

export function ResetPasswordPage() {
    
    const [searchParams] = useSearchParams()

    const { form, onSubmit, token, isLoading } = useResetPassword(searchParams)

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <Card className="w-full max-w-md text-center shadow-lg border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600 font-bold">Link Inválido</CardTitle>
                        <CardDescription>
                            Este link de recuperação de senha é inválido ou expirou.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                            <a href="/forgot-password">Solicitar novo link</a>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Nova Senha</CardTitle>
                    <CardDescription className="text-center">
                        Escolha uma nova senha segura para sua conta.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FieldGroup className="space-y-4">
                            <Controller
                                control={form.control}
                                name="password"
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="password">Nova Senha</FieldLabel>
                                        <div className="relative">
                                            <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                {...field}
                                                id="password"
                                                type="password"
                                                placeholder="******"
                                                className="pl-9"
                                                aria-invalid={fieldState.invalid}
                                            />
                                        </div>
                                        {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                                    </Field>
                                )}
                            />

                            <Controller
                                control={form.control}
                                name="confirmPassword"
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="confirmPassword">Confirmar Nova Senha</FieldLabel>
                                        <div className="relative">
                                            <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                {...field}
                                                id="confirmPassword"
                                                type="password"
                                                placeholder="******"
                                                className="pl-9"
                                                aria-invalid={fieldState.invalid}
                                            />
                                        </div>
                                        {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                                    </Field>
                                )}
                            />
                        </FieldGroup>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                            ) : (
                                "Redefinir minha senha"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}