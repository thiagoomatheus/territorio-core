import { useTRPC } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const managerSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    phone: z.string()
        .min(10, "O telefone deve ter DDD + Número (mínimo 10 dígitos)")
        .regex(/^\d+$/, "Apenas números são permitidos"),
    active: z.boolean().default(true),
});

type ManagerFormValues = z.infer<typeof managerSchema>;

export function useManagersPage() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    // Estados
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingManager, setEditingManager] = useState<{ id: string } | null>(null);

    // React Hook Form
    const form = useForm({
        resolver: zodResolver(managerSchema),
        defaultValues: {
            name: "",
            phone: "",
            active: true
        }
    });

    // --- QUERIES ---
    const { data: managers, isLoading } = useQuery(trpc.managers.list.queryOptions({
        search: search,
        onlyActive: !showInactive,
    }, {
        placeholderData: keepPreviousData
    }));

    // --- MUTATIONS ---
    const createMutation = useMutation(trpc.managers.create.mutationOptions({
        onSuccess: () => {
            toast.success("Dirigente cadastrado com sucesso!");
            queryClient.invalidateQueries(
                trpc.managers.list.queryFilter({
                    search: search,
                    onlyActive: !showInactive
                })
            );
            handleCloseDialog();
        },
        onError: (err) => toast.error("Erro ao criar dirigente", { description: err.message })
    }));

    const updateMutation = useMutation(trpc.managers.update.mutationOptions({
        onSuccess: () => {
            toast.success("Dados atualizados com sucesso!");
            queryClient.invalidateQueries(
                trpc.managers.list.queryFilter({
                    search: search,
                    onlyActive: !showInactive
                })
            );
            handleCloseDialog();
        },
        onError: (err) => toast.error("Erro ao atualizar dirigente", { description: err.message })
    }));

    // --- HANDLERS ---
    const handleOpenCreate = () => {
        setEditingManager(null);
        form.reset({ name: "", phone: "", active: true });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (manager: any) => {
        setEditingManager({ id: manager.id });
        form.reset({
            name: manager.name,
            phone: manager.phone,
            active: manager.active ?? true
        });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        form.reset();
    };

    const onSubmit = (values: ManagerFormValues) => {
        if (editingManager) {
            updateMutation.mutate({
                id: editingManager.id,
                name: values.name,
                phone: values.phone,
                active: values.active
            });
        } else {
            createMutation.mutate({
                name: values.name,
                phone: values.phone
            });
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return {
        search,
        setSearch,
        showInactive,
        setShowInactive,
        isDialogOpen,
        setIsDialogOpen,
        editingManager,
        setEditingManager,
        handleOpenCreate,
        handleOpenEdit,
        handleCloseDialog,
        managers,
        isLoading,
        form,
        onSubmit,
        isSaving
    };

}