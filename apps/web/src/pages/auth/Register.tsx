import { Link } from "react-router-dom"
import { useRegister } from "@/hooks/auth/useRegister"
import { Controller } from "react-hook-form"

// Componentes UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"

export function RegisterPage() {
    const { form, handleRegister, isLoading } = useRegister()

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-10 px-4">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Criar Nova Conta</CardTitle>
                    <CardDescription>
                        Cadastre-se para gerenciar territórios e automatizar designações
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-6">
                        
                        <FieldGroup className="space-y-4">
                            <Controller
                                control={form.control}
                                name="name"
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="name">Nome Completo</FieldLabel>
                                        <Input
                                            {...field}
                                            id="name"
                                            placeholder="Ex: João Silva"
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
                                name="email"
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="email">E-mail</FieldLabel>
                                        <Input
                                            {...field}
                                            id="email"
                                            type="email"
                                            placeholder="Ex: joao.silva@exemplo.com"
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
                                        <FieldLabel htmlFor="password">Senha</FieldLabel>
                                        <Input
                                            {...field}
                                            id="password"
                                            type="password" 
                                            placeholder="********"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.error && (
                                            <FieldError>{fieldState.error.message}</FieldError>
                                        )}
                                    </Field>
                                )}
                            />
                        </FieldGroup>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="px-2 text-muted-foreground bg-white">
                                    Dados da Congregação
                                </span>
                            </div>
                        </div>
                        
                        <FieldGroup className="space-y-4">
                            <Controller
                                control={form.control}
                                name="congregationName"
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="congregationName">Nome da Congregação</FieldLabel>
                                        <Input
                                            {...field}
                                            id="congregationName"
                                            placeholder="Ex: Central de São Paulo"
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
                                name="congregationNumber"
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="congregationNumber">Número Identificador</FieldLabel>
                                        <Input
                                            {...field}
                                            id="congregationNumber"
                                            type="number"
                                            placeholder="Ex: 12345"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            O número oficial da sua congregação.
                                        </p>
                                        {fieldState.error && (
                                            <FieldError>{fieldState.error.message}</FieldError>
                                        )}
                                    </Field>
                                )}
                            />
                        </FieldGroup>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Criando conta..." : "Cadastrar e Continuar"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center border-t pt-6">
                    <p className="text-sm text-muted-foreground">
                        Já possui uma conta?{" "}
                        <Link to="/login" className="text-primary font-medium hover:underline">
                            Fazer Login
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}