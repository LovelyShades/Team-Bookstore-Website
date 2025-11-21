import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LogIn } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      setIsLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created!');
      }
    } else {
      const { error } = await signIn(email, password);
      setIsLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Signed in!');
        navigate('/');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast.error('Google sign in failed');
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 mt-20">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <LogIn className="h-8 w-8 text-foreground" />
        <span className="text-primary">Log-In</span>
      </h1>

      <div className="mb-4 flex gap-4 border-b border-border pb-2">
        <button
          onClick={() => setIsSignUp(false)}
          className={isSignUp ? 'text-muted-foreground' : 'font-bold text-primary'}
        >
          Sign In
        </button>
        <button
          onClick={() => setIsSignUp(true)}
          className={isSignUp ? 'font-bold text-primary' : 'text-muted-foreground'}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {isSignUp && (
          <div>
            <label htmlFor="fullName" className="block mb-1 text-foreground">Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-input bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block mb-1 text-foreground">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-input bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-1 text-foreground">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-input bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-border">
        <button
          onClick={handleGoogleSignIn}
          className="btn-secondary w-full"
        >
          Google Sign In
        </button>
      </div>
    </div>
  );
};

export default Auth;
