import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTRPC } from '../../utils/trpc';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const registerSchema = z.object({
    name: z.string().min(3, 'Nome muito curto'),
    email: z.email('E-mail inválido'),
    password: z.string().min(8, 'Senha obrigatória de no mínimo 8 caracteres').max(30, 'Senha muito longa'),
    congregationName: z.string().min(3, 'Nome da congregação curto'),
    congregationNumber: z.coerce.number<string>().min(1, 'Número inválido'),
});

type RegisterData = z.infer<typeof registerSchema>;

export function useRegister() {
    const trpc = useTRPC();
    const navigate = useNavigate();

    const registerMutation = useMutation(trpc.auth.register.mutationOptions({
        onSuccess: (data) => {
            localStorage.setItem('territorio-token', data.token);
            toast.success("Conta criada com sucesso!", {
                description: `Bem-vindo, ${data.user.name}! Vamos configurar seu WhatsApp.`,
                position: 'top-right',
            });
            navigate('/setup'); 
        },
        onError: (error) => {
            toast.error("Erro ao criar conta!", {
                description: error.message,
                position: 'top-right',
            });
        }
    }));
    

    const form = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            congregationName: '',
            congregationNumber: undefined,
        },
    });

    const handleRegister = (data: RegisterData) => {
        registerMutation.mutate(data);
    };

    return {
        form,
        handleRegister,
        isLoading: registerMutation.isPending,
    };
}