import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { apiClient } from '../../shared/api/apiClient';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Input } from '../../shared/components/Input';
import { useToastStore } from '../../shared/components/toast.store';
import { useAuthStore } from './auth.store';
import type { LoginResponse, RoleName } from './auth.types';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username atau email wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const defaultPathByRole: Record<RoleName, string> = {
  KASIR: '/kasir',
  APOTEKER: '/pelayanan/resep',
  MANAGER: '/dashboard',
  PEMILIK: '/dashboard',
};

const allowedPathPrefixesByRole: Record<RoleName, string[]> = {
  KASIR: ['/kasir', '/riwayat-transaksi', '/retur-penjualan'],
  APOTEKER: ['/dashboard', '/pelayanan/resep', '/pelayanan/konseling', '/pemesanan'],
  MANAGER: ['/'],
  PEMILIK: ['/dashboard'],
};

function resolvePostLoginPath(role: RoleName, requestedPath: string) {
  const allowedPrefixes = allowedPathPrefixesByRole[role];
  const isAllowed = allowedPrefixes.some((path) =>
    path === '/' ? true : requestedPath.startsWith(path),
  );

  return isAllowed ? requestedPath : defaultPathByRole[role];
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToastStore((state) => state.show);
  const { accessToken, user, setSession } = useAuthStore();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  });

  if (accessToken && user) {
    return <Navigate to={resolvePostLoginPath(user.role, from)} replace />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const session = await apiClient.post<LoginResponse>('/auth/login', values);
      setSession(session);
      toast('Login berhasil');
      navigate(resolvePostLoginPath(session.user.role, from), { replace: true });
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Login gagal');
    }
  });

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm font-medium text-emerald-700">POS Apotek Risyah</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Login</h1>
          <p className="mt-2 text-sm text-slate-600">
            Masuk untuk mengakses area kerja sesuai role pengguna.
          </p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Username atau Email"
            autoComplete="username"
            error={form.formState.errors.usernameOrEmail?.message}
            {...form.register('usernameOrEmail')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />
          <Button type="submit" fullWidth disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
            Masuk
          </Button>
        </form>
      </Card>
    </main>
  );
}
