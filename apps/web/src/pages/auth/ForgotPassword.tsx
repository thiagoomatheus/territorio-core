import { Controller } from "react-hook-form"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useForgotPassword } from "@/hooks/auth/useForgotPassword"

export function ForgotPasswordPage() {

    const { form, onSubmit, isSubmitted, isLoading } = useForgotPassword()
    
    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <Card className="w-full max-w-md text-center shadow-lg">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-green-100 rounded-full">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Verifique seu e-mail</CardTitle>
                        <CardDescription>
                            Enviamos um link de recuperação para <b>{form.getValues('email')}</b>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Se você não receber em alguns minutos, verifique sua caixa de spam ou o terminal do seu servidor (Modo Core).
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                            <Link to="/login">Voltar para o Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                         <Button asChild variant="ghost" size="icon" className="rounded-full">
                            <Link to="/login"><ArrowLeft className="h-4 w-4" /></Link>
                         </Button>
                         <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
                    </div>
                    <CardDescription>
                        Digite seu e-mail e enviaremos um link para você definir uma nova senha.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FieldGroup>
                            <Controller
                                control={form.control}
                                name="email"
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="email">E-mail de Cadastro</FieldLabel>
                                        <div className="relative">
                                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                {...field}
                                                id="email"
                                                type="email"
                                                placeholder="seu@email.com"
                                                className="pl-9"
                                                aria-invalid={fieldState.invalid}
                                            />
                                        </div>
                                        {fieldState.error && (
                                            <FieldError>{fieldState.error.message}</FieldError>
                                        )}
                                    </Field>
                                )}
                            />
                        </FieldGroup>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                            ) : (
                                "Enviar link de recuperação"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link to="/login" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                        Lembrou a senha? Faça login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}