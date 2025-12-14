import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register: registerUser } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const success = await login(data.email, data.password);
      if (success) {
        toast({ title: 'Welcome back!', description: 'Login successful.' });
        navigate('/dashboard');
      } else {
        toast({ title: 'Login failed', description: 'Invalid credentials.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const success = await registerUser({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      });
      if (success) {
        toast({ title: 'Account created!', description: 'Welcome to WealthTracker.' });
        navigate('/dashboard');
      } else {
        toast({ title: 'Registration failed', description: 'Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: isLogin ? -20 : 20, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, x: isLogin ? 20 : -20, scale: 0.95, transition: { duration: 0.3 } },
  };

  return (
    <>
      <Helmet>
        <title>{isLogin ? 'Login' : 'Register'} | WealthTracker</title>
        <meta name="description" content="Access your personalized wealth management dashboard" />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
            animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/5 blur-3xl"
            animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-primary/3 to-transparent"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <span className="text-2xl font-display font-bold text-gradient">WealthTracker</span>
          </Link>

          {/* Glass card */}
          <div className="glass-card p-8 rounded-2xl">
            {/* Tab switcher */}
            <div className="flex bg-card/50 rounded-xl p-1 mb-8 relative">
              <motion.div
                className="absolute inset-y-1 rounded-lg bg-primary/20 border border-primary/30"
                initial={false}
                animate={{ left: isLogin ? '4px' : '50%', width: 'calc(50% - 4px)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors relative z-10 ${
                  isLogin ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors relative z-10 ${
                  !isLogin ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Forms with AnimatePresence */}
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form
                  key="login"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-5"
                >
                  <GlassInput
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    leftIcon={<Mail className="w-5 h-5" />}
                    error={loginForm.formState.errors.email?.message}
                    {...loginForm.register('email')}
                  />
                  <GlassInput
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-5 h-5" />}
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register('password')}
                  />

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-border bg-card/50 text-primary focus:ring-primary" />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <button type="button" className="text-primary hover:text-primary/80 transition-colors">
                      Forgot password?
                    </button>
                  </div>

                  <GlassButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="w-full"
                  >
                    Sign In
                  </GlassButton>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={registerForm.handleSubmit(handleRegister)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <GlassInput
                      label="First Name"
                      placeholder="John"
                      leftIcon={<User className="w-5 h-5" />}
                      error={registerForm.formState.errors.firstName?.message}
                      {...registerForm.register('firstName')}
                    />
                    <GlassInput
                      label="Last Name"
                      placeholder="Doe"
                      error={registerForm.formState.errors.lastName?.message}
                      {...registerForm.register('lastName')}
                    />
                  </div>
                  <GlassInput
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    leftIcon={<Mail className="w-5 h-5" />}
                    error={registerForm.formState.errors.email?.message}
                    {...registerForm.register('email')}
                  />
                  <GlassInput
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-5 h-5" />}
                    error={registerForm.formState.errors.password?.message}
                    {...registerForm.register('password')}
                  />
                  <GlassInput
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-5 h-5" />}
                    error={registerForm.formState.errors.confirmPassword?.message}
                    {...registerForm.register('confirmPassword')}
                  />

                  <label className="flex items-start gap-2 cursor-pointer text-sm">
                    <input type="checkbox" className="mt-1 rounded border-border bg-card/50 text-primary focus:ring-primary" />
                    <span className="text-muted-foreground">
                      I agree to the{' '}
                      <button type="button" className="text-primary hover:underline">Terms of Service</button>
                      {' '}and{' '}
                      <button type="button" className="text-primary hover:underline">Privacy Policy</button>
                    </span>
                  </label>

                  <GlassButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="w-full"
                  >
                    Create Account
                  </GlassButton>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Social login divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Social buttons */}
            <div className="grid grid-cols-2 gap-3">
              <GlassButton variant="ghost" size="md" className="w-full">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </GlassButton>
              <GlassButton variant="ghost" size="md" className="w-full">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </GlassButton>
            </div>
          </div>

          {/* Back to home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-6"
          >
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              ← Back to home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Auth;
