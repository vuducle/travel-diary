'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center bg-[#f7f2ea] p-6">
        <Card className="w-full max-w-sm bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-2xl font-semibold">
              Forgot Password
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <form className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  disabled
                />
              </div>
              <Button className="w-full" type="submit" disabled>
                Send Reset Link
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">
                Remember your password?{' '}
                <Link
                  href="/login"
                  className="text-primary hover:underline"
                >
                  Login
                </Link>
              </p>
            </div>
            <div className="mt-4 text-center text-sm ">
              <p className="text-red-500 text-sm">
                This feature is not yet implemented. - Julia Nguyễn
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
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
