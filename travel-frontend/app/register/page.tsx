'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    bio: '',
    location: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();
  const { showToast } = useToast();

  const PUBLIC_API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3598';

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side password match validation
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    try {
      // Build payload explicitly without confirmPassword
      const { email, username, password, name, bio, location } = form;
      const payload = {
        email,
        username,
        password,
        name,
        bio,
        location,
      };
      await axios.post(`${PUBLIC_API_URL}/auth/register`, payload);
      showToast('Registration successful! Please login.', 'success');
      router.push('/login');
    } catch (err) {
      console.error('Registration failed', err);
      // Attempt to extract a meaningful message if it's an Axios error
      const anyErr = err as unknown as {
        response?: { data?: { message?: string | string[] } };
      };
      const message =
        anyErr?.response?.data?.message || 'Registration failed';
      showToast(
        Array.isArray(message) ? message.join('\n') : message,
        'error'
      );
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Left side form */}
      <div className="flex items-center justify-center bg-[#f7f2ea] p-6">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-2xl font-semibold">
              Create Account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="armindorri@test.de"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="armindorri"
                  value={form.username}
                  onChange={(e) => update('username', e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  placeholder="armindorri123"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  autoComplete="new-password"
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    update('confirmPassword', e.target.value)
                  }
                  required
                  autoComplete="new-password"
                  type={showPassword ? 'text' : 'password'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Armin Dorri"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="I love Berlin and Vietnamese food"
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Teheran, Iran"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-white hover:bg-primary/90"
                >
                  Register
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-secondary text-white hover:bg-secondary/80"
                  onClick={() => router.push('/login')}
                >
                  Back to login
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                By creating an account you agree to our{' '}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-primary"
                >
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link
                  href="/imprint"
                  className="underline underline-offset-2 hover:text-primary"
                >
                  Imprint
                </Link>
              </p>
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
  );
}
