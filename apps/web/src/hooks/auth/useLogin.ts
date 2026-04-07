import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTRPC } from '@/utils/trpc';

// Adicionar check com regex aqui

const loginSchema = z.object({
    email: z.email('E-mail inválido'),
    password: z.string().min(8, 'Senha obrigatória de no mínimo 8 caracteres').max(30, 'Senha muito longa'),
});

type LoginData = z.infer<typeof loginSchema>;

export function useLogin() {
    const trpc = useTRPC();
    const navigate = useNavigate();
    
    const loginMutation = useMutation(trpc.auth.login.mutationOptions({
        onSuccess: (data) => {
            localStorage.setItem('territorio-token', data.token);
            
            toast.success("Login bem-sucedido!", {
                description: `Bem-vindo de volta, ${data.user.name}!`,
                position: 'top-right',
            });

            data.user.congregationId ? navigate('/setup') :

            setTimeout(() => {
                navigate('/', { replace: true });
            }, 100);
        },
        onError: (error) => {
            toast.error("Erro ao fazer login!", {
                description: error.message,
                position: 'top-right',
            });
        }
    }));
    
    const form = useForm<LoginData>({
        resolver: zodResolver(loginSchema),
    });
    
    const handleLogin = (data: LoginData) => {
        loginMutation.mutate(data);
    };

    return {
        form,
        handleLogin,
        isLoading: loginMutation.isPending,
        error: loginMutation.error,
    };
}