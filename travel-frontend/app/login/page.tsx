'use client';
import PublicGuard from '@/components/core/public-guard';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '@/lib/api/client';
import { setToken, setUser } from '@/lib/redux/authSlice';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { showToast } = useToast();

  // Base URL handled by api client

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post(
        `/auth/login`,
        {
          email,
          password,
        },
        { withCredentials: true }
      );
      dispatch(setToken(response.data.accessToken));
      // Hydrate full profile after login so username/coverImage are available
      try {
        const me = await api.get('/users/profile');
        if (me?.data) {
          dispatch(setUser(me.data));
        }
      } catch {
        // Non-fatal: UI will still work with JWT-decoded minimal user
        console.warn('Unable to fetch profile after login');
      }
      showToast('Login successful!', 'success');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
      showToast(
        'Login failed. Please check your credentials.',
        'error'
      );
    }
  };

  return (
    <PublicGuard>
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        {/* Left side form */}
        <div className="flex items-center justify-center bg-[#f7f2ea] p-6">
          <Card className="w-full max-w-sm bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-2xl font-semibold">
                Sign In
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="armindorri@kasselgermany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    type={showPassword ? 'text' : 'password'}
                  />
                  <Button
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <div className="text-right">
                    <Link
                      aria-disabled={!email}
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary text-white hover:bg-primary/90 cursor-pointer"
                  >
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-secondary text-white hover:bg-secondary/80 cursor-pointer"
                    onClick={() => router.push('/register')}
                  >
                    Create an account?
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        {/* Right side image */}
        <div className="relative hidden md:block">
          <Image
            src="/form/bg-chinatown.jpg"
            alt="City night street"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      </div>
    </PublicGuard>
  );
}
