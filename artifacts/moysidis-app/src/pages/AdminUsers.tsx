import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, UserPlus, UserRoundCheck, UserRoundX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/useAuth';

type AccessRole = 'viewer' | 'editor';
type AdminUser = {
  id: number;
  email: string;
  role: AccessRole;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

const USERS_KEY = ['admin-users'];

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Something went wrong');
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

function formatDate(value: string | null): string {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const [email, setEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<AccessRole>('viewer');
  const [notice, setNotice] = React.useState('');

  const usersQuery = useQuery({
    queryKey: USERS_KEY,
    queryFn: () => adminFetch<AdminUser[]>('/api/admin/users'),
    enabled: role === 'owner',
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      adminFetch<{ user: AdminUser }>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email, role: inviteRole }),
      }),
    onSuccess: () => {
      setEmail('');
      setNotice('Invitation sent. The user can open the secure link from their email.');
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
    onError: (error: Error) => setNotice(error.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, nextRole }: { id: number; nextRole: AccessRole }) =>
      adminFetch<AdminUser>(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      }),
    onSuccess: () => {
      setNotice('Access level updated.');
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
    onError: (error: Error) => setNotice(error.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) => adminFetch<void>(`/api/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setNotice('Access revoked.');
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
    onError: (error: Error) => setNotice(error.message),
  });

  if (role !== 'owner') {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <h1 className="text-xl font-semibold text-primary">Owner access required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              User administration is only available to the owner account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = usersQuery.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#5B9BD0]">Private settings</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">Admin access</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Invite trusted people by email. Viewers can read the console; editors can also add and change practice data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#EFF6FC] p-2.5 text-[#4A87BB]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Invite someone</CardTitle>
              <CardDescription className="mt-1">They will receive a secure, single-use sign-in link.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              setNotice('');
              inviteMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="person@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Access level</Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as AccessRole)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="viewer">View only</option>
                <option value="editor">Can edit</option>
              </select>
            </div>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Sending…' : 'Send invitation'}
            </Button>
          </form>
          {notice && <p className="mt-4 text-sm text-[#4A87BB]">{notice}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>People with access</CardTitle>
          <CardDescription>Revoked users can no longer use previously issued links or sessions.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {usersQuery.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading users…</p>
          ) : usersQuery.isError ? (
            <p className="p-6 text-sm text-red-600">{(usersQuery.error as Error).message}</p>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <UserRoundCheck className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No invited users yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">{user.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last sign-in: {formatDate(user.lastLoginAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={user.role}
                      disabled={!user.active || updateRoleMutation.isPending}
                      onChange={(event) =>
                        updateRoleMutation.mutate({ id: user.id, nextRole: event.target.value as AccessRole })
                      }
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                      aria-label={`Access level for ${user.email}`}
                    >
                      <option value="viewer">View only</option>
                      <option value="editor">Can edit</option>
                    </select>
                    {user.active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={revokeMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Revoke access for ${user.email}?`)) revokeMutation.mutate(user.id);
                        }}
                      >
                        <UserRoundX className="mr-2 h-4 w-4" />
                        Revoke
                      </Button>
                    ) : (
                      <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">Revoked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}