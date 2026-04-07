import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

export function useMe() {
    const trpc = useTRPC();
    const navigate = useNavigate();

    const token = localStorage.getItem("territorio-token");
    
    const { 
        data: user, 
        isLoading, 
        isError, 
        error 
    } = useQuery(trpc.auth.me.queryOptions(undefined, {
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        enabled: !!token,
    }));
    
    useEffect(() => {
        if (!isLoading && isError) {
            if (error?.data?.code === 'UNAUTHORIZED') {
                localStorage.removeItem("territorio-token");
                navigate("/login");
            }
        }

        if (!token) {
            navigate("/login", { replace: true });
        }
    }, [isError, error, navigate]);

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
    };
}