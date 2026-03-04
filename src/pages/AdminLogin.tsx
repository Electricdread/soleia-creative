import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, UserPlus } from 'lucide-react';
import soleiaIcon from '@/assets/sol-icon.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/admin', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: 'Login failed',
          description: error.message || 'Invalid credentials',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Welcome back!',
        description: 'Redirecting to admin portal...',
      });

      navigate('/admin');
    } catch (err) {
      toast({
        title: 'Login failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signUp(email, password);
      
      if (error) {
        toast({
          title: 'Registration failed',
          description: error.message || 'Could not create account',
          variant: 'destructive',
        });
        return;
      }

      const userId = data?.user?.id;
      if (userId) {
        try {
          await supabase.functions.invoke('notify-admin-signup', {
            body: {
              userEmail: email,
              userId: userId,
            },
          });
          console.log('Admin notification sent for userId:', userId);
        } catch (notifyError) {
          console.error('Failed to send admin notification:', notifyError);
        }
      } else {
        console.error('No user ID returned from signUp');
      }

      toast({
        title: 'Registration submitted!',
        description: 'Your request has been sent for approval. You will be notified once approved.',
      });

      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setActiveTab('signin');
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <img 
            src={soleiaIcon} 
            alt="Soleia" 
            className="h-20 w-20 object-contain mb-4"
          />
          <span className="text-2xl font-bold tracking-wide text-white">SOLEIA</span>
        </div>

        {/* Login/Signup Card */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-lg p-8 shadow-2xl">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-800">
              <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:text-black">
                <Lock className="w-4 h-4 mr-2" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-black">
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-white">Admin Login</h1>
                <p className="text-sm text-zinc-400">Sign in to access the portal</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-zinc-300">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="admin@soleia.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-zinc-300">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white/20"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white text-black hover:bg-zinc-200 font-medium h-11"
                  disabled={isLoading || authLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-white">Request Access</h1>
                <p className="text-sm text-zinc-400">Submit your registration for approval</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-zinc-300">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-zinc-300">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="text-zinc-300">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white/20"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white text-black hover:bg-zinc-200 font-medium h-11"
                  disabled={isLoading || authLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Request Access'
                  )}
                </Button>
              </form>

              <p className="text-xs text-zinc-500 text-center mt-4">
                Your registration will be reviewed by an administrator. You'll receive an email once approved.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-zinc-600 text-sm mt-6">
          Soleia Creative Management System
        </p>
      </div>
    </div>
  );
}
