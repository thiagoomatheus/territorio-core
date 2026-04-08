import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export function useSetup() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  
  const { data: congregation, isLoading, refetch } = useQuery(trpc.congregation.get.queryOptions(undefined, {
    refetchInterval: (query) => {
      const step = query.state.data?.setupStep;
      return step === 0 ? 3000 : false;
    }
  }));

  const step = congregation?.setupStep || 0;
  
  useEffect(() => {
    if (step >= 3) {
      navigate("/");
    }
  }, [step, navigate]);

  return {
    step,
    isLoading,
    congregation,
    refetch
  };
}