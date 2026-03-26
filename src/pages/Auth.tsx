import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail, Lock, User, Loader2, ArrowLeft, Shield, Zap,
  Activity, Shuffle, Clock, Moon, Timer, BarChart3,
  Eye, EyeOff, KeyRound, Fingerprint, Globe, CheckCircle2, Star, Target, Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
});

const features = [
  { icon: Activity, title: 'S-Curve Delivery', desc: 'Mimics natural viral growth patterns', bg: 'bg-[#0ea5e9]/10', color: 'text-[#0ea5e9]' },
  { icon: Shuffle, title: 'Random Variance', desc: 'Unpredictable quantities like real users', bg: 'bg-[#0ea5e9]/10', color: 'text-[#0ea5e9]' },
  { icon: Clock, title: 'Peak Hour Boost', desc: 'Automatic 1.5× boost during IST peaks', bg: 'bg-[#0ea5e9]/10', color: 'text-[#0ea5e9]' },
  { icon: Timer, title: 'Random Jitter', desc: 'Execution times vary — bot-proof', bg: 'bg-[#f59e0b]/10', color: 'text-[#f59e0b]' },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/engagement-order');
    }
  }, [user, isLoading, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMessage(''); setIsSubmitting(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !z.string().email().safeParse(trimmedEmail).success) {
        setError('Please enter a valid email address');
        setIsSubmitting(false); return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) setError(error.message || 'Failed to send reset email.');
      else setSuccessMessage('Password reset email sent! Check your inbox.');
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMessage(''); setIsSubmitting(true);
    console.log('--- Auth Submit Started ---');
    
    const timeoutId = setTimeout(() => {
      setIsSubmitting(current => {
        if (current) {
          setError('Connection Timeout. Request is taking too long.');
          console.error('--- Auth Timeout Reached ---');
          return false;
        }
        return false;
      });
    }, 20000);

    try {
      if (isLogin) {
        const v = loginSchema.safeParse({ email, password });
        if (!v.success) { setError(v.error.errors[0].message); setIsSubmitting(false); return; }
        const { error } = await signIn(email, password);
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('invalid login credentials')) {
            setError('Access Denied: Incorrect Key.');
          } else if (msg.includes('email not confirmed')) {
            setError('Terminal not verified. Check your inbox.');
          } else if (msg.includes('rate limit')) {
            setError('Security Lock: Try again in 5 mins.');
          } else {
            setError('Login Failed: Authorization Rejected.');
          }
          setIsSubmitting(false); return;
        }
        navigate('/engagement-order', { replace: true });
      } else {
        const v = signupSchema.safeParse({ email, password, fullName });
        if (!v.success) { setError(v.error.errors[0].message); setIsSubmitting(false); return; }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('already registered')) setError('This terminal email is already registered.');
          else if (msg.includes('rate limit')) setError('Too many attempts. Please wait 5 minutes.');
          else setError(error.message || 'Signup failed.');
          setIsSubmitting(false); clearTimeout(timeoutId); return;
        }
        
        console.log('--- Signup Success ---');
        // Since Email Confirmation is now OFF in Supabase, 
        // the user is often logged in immediately or can just switch to login.
        setSuccessMessage('Account Created Successfully!');
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (err: any) {
      if (!err?.message?.includes('abort')) {
        const msg = err?.message?.toLowerCase() || '';
        if (msg.includes('rate limit')) {
          setError('Security limit reached. Please wait 5 minutes before trying again.');
        } else {
          setError('Authorization terminal error. Please refresh.');
        }
      }
    } finally { 
      setIsSubmitting(false); 
      clearTimeout(timeoutId);
      console.log('--- Auth Handled ---');
    }
  };

  const reset = () => { setError(''); setSuccessMessage(''); setShowVerifyEmail(false); };

  return (
    <div className="min-h-screen bg-[#04060c] flex items-center justify-center p-4 md:p-10 font-sans selection:bg-[#0ea5e9]/40 overflow-hidden relative">

      {/* ── DYNAMIC 3D BACKGROUND ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none bg-[#08080a]">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#0ea5e9]/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#2563eb]/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      {/* ── MAIN AUTH CONSOLE CARD ── */}
      <div className="w-full max-w-[480px] relative z-10 px-4">

        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 bg-black border-2 border-white/20 rounded-[2.5rem] flex items-center justify-center mb-6 overflow-hidden p-0">
            <Zap className="w-10 h-10 text-[#0ea5e9] drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
          </div>
          <h1 className="text-4xl font-[1000] text-white tracking-tighter mb-1">Whopautopailot</h1>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#0ea5e9] opacity-80">AUTHENTICATION</p>
        </div>

        {/* The Glass Card Container */}
        <div className="relative">
          <div className="bg-[#0a0f1c]/90 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 md:p-14 relative overflow-hidden ring-1 ring-white/5">

            {/* Upper Light Line */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-60" />

            {/* Home Redirect */}
            <Link to="/" className="absolute top-8 right-10 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-[#0ea5e9] transition-none flex items-center gap-2 group">
              <ArrowLeft className="w-4 h-4 transition-none group-hover:-translate-x-1" /> RETURN
            </Link>

            <div className="mt-4">
              <h2 className="text-2xl font-[1000] text-white mb-2 leading-none">
                {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back.' : 'Create Account.'}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#0ea5e9]/60 mb-10">
                {isForgotPassword
                  ? 'ENTER EMAIL TO CONTINUE'
                  : isLogin
                    ? 'SIGN IN TO CONTINUE'
                    : 'JOIN THE PLATFORM'}
              </p>

              {/* ──── Verification Screen ──── */}
              {showVerifyEmail ? (
                <div className="text-center py-6">
                  <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[3rem] flex items-center justify-center mx-auto mb-8">
                    <Mail className="h-10 w-10 text-[#0ea5e9]" />
                  </div>
                  <h3 className="text-2xl font-[1000] text-white mb-4 tracking-tight">Check Your Inbox</h3>
                  <p className="text-[11px] font-bold text-white/30 mb-2 max-w-[240px] mx-auto leading-relaxed border-t border-white/5 pt-6">
                    A verification link has been sent to your email address.
                  </p>
                  <p className="text-[11px] font-bold text-[#0ea5e9]/80 mb-8 max-w-[240px] mx-auto leading-relaxed">
                    Note: If you don't see it, please check your <span className="text-white">spam</span> or <span className="text-white">junk</span> folder.
                  </p>
                  <div className="bg-[#0ea5e9]/5 p-5 rounded-2xl border border-[#0ea5e9]/20 mb-10 ring-1 ring-[#0ea5e9]/10">
                    <span className="text-xs font-black text-[#0ea5e9] tracking-tight">{email}</span>
                  </div>
                  <button type="button" onClick={() => { setShowVerifyEmail(false); setIsLogin(true); reset(); }}
                    className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0ea5e9] hover:text-white transition-none underline underline-offset-8 decoration-2 decoration-[#0ea5e9]/40">
                    ← BACK TO GATEWAY
                  </button>
                </div>
              ) : (
                <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-6">

                  {isForgotPassword ? (
                    /* ───── Forgot Password ───── */
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">EMAIL ADDRESS</Label>
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="h-14 rounded-2xl border-white/5 bg-white/5 focus:bg-white/10 focus:border-[#0ea5e9]/50 text-white font-bold px-6 border-2 transition-none"
                        />
                      </div>

                      {error && (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex gap-3 items-center">
                          <Shield className="h-4 w-4 text-rose-500 shrink-0" />
                          <p className="text-xs font-bold text-rose-200">{error}</p>
                        </div>
                      )}

                      {successMessage && (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3 items-center">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <p className="text-xs font-bold text-emerald-200">{successMessage}</p>
                        </div>
                      )}

                      <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-2xl bg-[#0ea5e9] hover:bg-[#8b76e5] text-white font-black text-sm uppercase tracking-widest transition-none disabled:opacity-80">
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> 
                            SENDING...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            SEND RESET LINK <ArrowLeft className="w-4 h-4 rotate-180" />
                          </span>
                        )}
                      </Button>

                      <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-center text-[10px] font-[1000] uppercase tracking-[0.2em] text-white/20 hover:text-white transition-none">
                        BACK TO LOGIN
                      </button>
                    </div>
                  ) : (
                    /* ───── Login / Signup ───── */
                    <div className="space-y-6">

                      {!isLogin && (
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">FULL NAME</Label>
                          <Input
                            placeholder="John Doe"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="h-14 rounded-2xl border-white/5 bg-white/5 focus:bg-white/10 focus:border-[#0ea5e9]/50 text-white font-bold px-6 border-2 transition-none placeholder:text-white/10"
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">EMAIL ADDRESS</Label>
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="h-14 rounded-2xl border-white/5 bg-white/5 focus:bg-white/10 focus:border-[#0ea5e9]/50 text-white font-bold px-6 border-2 transition-none placeholder:text-white/10"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-white/30">PASSWORD</Label>
                          {isLogin && (
                            <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[9px] font-black uppercase tracking-widest text-[#0ea5e9]/40 hover:text-[#0ea5e9] transition-none">
                              FORGOT PASSWORD?
                            </button>
                          )}
                        </div>
                        <div className="relative group/input">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="h-14 rounded-2xl border-white/5 bg-white/5 focus:bg-white/10 focus:border-[#0ea5e9]/80 text-white font-bold px-6 border-2 transition-none placeholder:text-white/5 pr-14"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#0ea5e9] transition-none">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex gap-3 items-center">
                          <Shield className="h-4 w-4 text-rose-500 shrink-0" />
                          <p className="text-[11px] font-bold text-rose-200 leading-tight">{error}</p>
                        </div>
                      )}

                      <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-[1.25rem] bg-white text-black hover:bg-white/95 font-black text-sm uppercase tracking-[0.3em] transition-none border-b-4 border-zinc-300 disabled:opacity-90 disabled:bg-zinc-200">
                        {isSubmitting ? (
                          <span className="flex items-center gap-2 text-zinc-600">
                            <Loader2 className="h-5 w-5 animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                            {isLogin ? 'AUTHENTICATING...' : 'CREATING ACCOUNT...'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            {isLogin ? 'SIGN IN' : 'SIGN UP'}
                            <Zap className="w-4 h-4 fill-current" />
                          </span>
                        )}
                      </Button>

                      <div className="pt-4 text-center">
                        <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-bold text-white/20 tracking-widest uppercase">
                          {isLogin ? "Don't have an account? " : 'Already have an account? '}
                          <span className="text-[#0ea5e9] font-black ml-1 border-b border-[#0ea5e9]/30 hover:text-white transition-colors">{isLogin ? 'SIGN UP' : 'SIGN IN'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="mt-10 flex items-center justify-center gap-8 opacity-30">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-white" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">ENCRYPTED</span>
          </div>
          <div className="flex items-center gap-2">
            <Fingerprint className="h-3 w-3 text-white" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">BIO-SCAN</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-3 w-3 text-white" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">NETWORK</span>
          </div>
        </div>

        {/* Telegram Channel Link */}
        <div className="mt-12 group">
          <a
            href="https://t.me/whopautopailotofficial"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#0ea5e9]/10 hover:border-[#0ea5e9]/30 transition-all duration-300 group/link"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0088cc]/20 flex items-center justify-center border border-[#0088cc]/30 shadow-inner group-hover/link:bg-[#0088cc]/30 transition-all">
                <svg className="w-5 h-5 text-[#0088cc] fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.61.8-1.88 1.77-1.88.21 0 .69.05.99.23.32.19.43.46.46.72.02.16.01.32-.01.48z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0ea5e9] mb-0.5">Community Gateway</p>
                <p className="text-sm font-bold text-white group-hover/link:text-[#0ea5e9] transition-colors">Join Official Telegram</p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-white/20 rotate-180 group-hover/link:text-[#0ea5e9] group-hover/link:translate-x-1 transition-all" />
          </a>
        </div>
      </div>
    </div>
  );
}
