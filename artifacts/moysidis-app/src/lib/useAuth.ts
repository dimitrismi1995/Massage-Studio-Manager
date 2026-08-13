import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API = '/api/auth';

async function fetchMe(): Promise<{ authenticated: boolean }> {
  const res = await fetch(`${API}/me`, { credentials: 'include' });
  if (!res.ok) return { authenticated: false };
  return res.json();
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('Wrong password');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth'] }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth'] }),
  });

  return {
    isAuthenticated: data?.authenticated ?? false,
    isLoading,
    login: loginMutation.mutateAsync,
    loginPending: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: () => logoutMutation.mutate(),
  };
}
