import { Link } from "react-router-dom"
import { useLogin } from "@/hooks/auth/useLogin"
import { Controller } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"

export function LoginPage() {
    const { form, handleLogin, isLoading } = useLogin()

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Acessar Painel</CardTitle>
                    <CardDescription>
                        Entre com suas credenciais para gerenciar territórios
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
                        <FieldGroup className="space-y-4">
                            
                            <Controller
                                control={form.control}
                                name="email"
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="email">E-mail</FieldLabel>
                                        <Input
                                            {...field}
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.error && (
                                            <FieldError>{fieldState.error.message}</FieldError>
                                        )}
                                    </Field>
                                )}
                            />
                            
                            <Controller
                                control={form.control}
                                name="password"
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <FieldLabel htmlFor="password">Senha</FieldLabel>
                                            <Link 
                                                to="/forgot-password" 
                                                className="text-xs text-muted-foreground hover:text-primary hover:underline"
                                            >
                                                Esqueceu a senha?
                                            </Link>
                                        </div>
                                        <Input
                                            {...field}
                                            id="password"
                                            type="password"
                                            placeholder="******"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.error && (
                                            <FieldError>{fieldState.error.message}</FieldError>
                                        )}
                                    </Field>
                                )}
                            />
                        </FieldGroup>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Entrando..." : "Entrar"}
                        </Button>
                    </form>
                </CardContent>

                {!import.meta.env.VITE_CORE && (
                    <CardFooter className="justify-center border-t pt-6">
                        <p className="text-sm text-muted-foreground">
                            Não tem conta?{" "}
                            <Link to="/register" className="text-primary font-medium hover:underline">
                                Crie sua congregação
                            </Link>
                        </p>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}