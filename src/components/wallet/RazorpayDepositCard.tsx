import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Zap, IndianRupee, ExternalLink, ArrowLeft,
  CheckCircle2, ShieldCheck, Upload, Send, Sparkles,
  Clock, ImagePlus, ArrowRight, MessageCircle, Wallet
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';

const RAZORPAY_PAGE_URL = "https://razorpay.me/@organicsmm";
const TELEGRAM_SUPPORT = "https://t.me/HenryMiller08";

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

export default function RazorpayDepositCard() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { rates } = useCurrency();
  const [inrAmount, setInrAmount] = useState('');
  const [usdCredit, setUsdCredit] = useState<number>(0);
  const [paymentId, setPaymentId] = useState('');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState<'amount' | 'pay' | 'proof' | 'done'>('amount');

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (user?.email) setEmail(user.email);
  }, [profile, user]);

  useEffect(() => {
    const val = parseFloat(inrAmount);
    if (!isNaN(val) && val > 0) {
      const inrRate = rates['INR'] || 83.5;
      setUsdCredit(parseFloat((val / inrRate).toFixed(2)));
    } else {
      setUsdCredit(0);
    }
  }, [inrAmount, rates]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = async () => {
    if (!inrAmount || Number(inrAmount) < 20) {
      toast({ title: 'Invalid amount', description: 'Minimum deposit is ₹20', variant: 'destructive' });
      return;
    }
    if (!paymentId.trim()) {
      toast({ title: 'Missing Reference', description: 'Please enter UTR / Transaction ID', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const ext = screenshot.name.split('.').pop() || 'jpg';
        const path = `${user?.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('payment-proofs')
          .upload(path, screenshot, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(path);
          screenshotUrl = urlData.publicUrl;
        }
      }

      const descriptionObj = {
        text: `Paid: ₹${inrAmount} | Name: ${fullName} | Email: ${email} | Credit: $${usdCredit}`,
        screenshot_url: screenshotUrl,
      };

      const { error } = await supabase.from('transactions').insert({
        user_id: user?.id,
        type: 'deposit',
        amount: usdCredit,
        balance_after: 0,
        status: 'pending',
        payment_method: 'razorpay_manual',
        payment_reference: paymentId,
        description: JSON.stringify(descriptionObj),
      });

      if (error) throw error;

      // Send Telegram Notification to Admin
      const appUrl = window.location.origin;
      supabase.functions.invoke('send-telegram-notification', {
        body: {
          message: `<b>🚨 NEW DEPOSIT REQUEST</b>\n\n` +
            `👤 <b>Name:</b> ${fullName || 'N/A'}\n` +
            `📧 <b>Email:</b> ${email || 'N/A'}\n` +
            `💰 <b>Paid:</b> ₹${inrAmount}\n` +
            `💵 <b>Credit:</b> $${usdCredit}\n` +
            `🆔 <b>UTR:</b> <code>${paymentId}</code>\n\n` +
            `<a href="${appUrl}/admin/deposits">🔗 Open Admin Panel</a>`,
          ...(screenshotUrl ? { photo_url: screenshotUrl } : {}),
        },
      }).catch(console.error);

      setIsSubmitted(true);
      setStep('done');
      toast({ title: '✅ Payment Proof Received!', description: 'Your balance will be credited within minutes.' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('amount');
    setInrAmount('');
    setPaymentId('');
    setScreenshot(null);
    setScreenshotPreview(null);
    setIsSubmitted(false);
  };

  return (
    <div className="relative group/card">
      <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-purple-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover/card:opacity-100 transition duration-1000"></div>

      <div className="three-d-card overflow-hidden mt-6 relative border border-white/10">
        {/* Header */}
        <div className="p-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/30 shadow-inner">
                <IndianRupee className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-white">UPI Payment</h2>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest opacity-80">Secured Gateway • Instant Processing</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-2 px-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 mr-2" />
              Verified Payment
            </Badge>
          </div>

          {/* Step Indicator */}
          {step !== 'done' && (
            <div className="flex items-center gap-2 mt-6 px-2">
              {['amount', 'pay', 'proof'].map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                    step === s ? 'bg-emerald-500 text-black scale-110 shadow-[0_0_20px_rgba(16,185,129,0.4)]' :
                    ['amount', 'pay', 'proof'].indexOf(step) > i ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-white/5 text-white/30'
                  }`}>
                    {['amount', 'pay', 'proof'].indexOf(step) > i ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-[2px] rounded-full transition-all duration-500 ${
                      ['amount', 'pay', 'proof'].indexOf(step) > i ? 'bg-emerald-500/40' : 'bg-white/5'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === STEP 1: ENTER AMOUNT === */}
        {step === 'amount' && (
          <div className="p-8 pt-4 space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border border-emerald-500/10 space-y-5">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Wallet className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="text-xs text-emerald-200/70 leading-relaxed font-extrabold uppercase tracking-tight">
                  Enter the amount you want to deposit. Funds are processed and credited instantly after verification.
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setInrAmount(String(amt))}
                    className={`py-3 rounded-xl text-sm font-black transition-all duration-300 border ${
                      inrAmount === String(amt)
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Custom Amount (INR)</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-2xl">₹</span>
                  <Input
                    type="number"
                    value={inrAmount}
                    onChange={(e) => setInrAmount(e.target.value)}
                    className="pl-12 input-3d h-20 font-black text-2xl text-white bg-white/5 border-white/10 rounded-[1.5rem]"
                    placeholder="Min: 20"
                  />
                  {usdCredit > 0 && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full text-sm border border-emerald-500/20">
                      ≈ ${usdCredit}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep('pay')}
              disabled={!inrAmount || Number(inrAmount) < 20}
              className="w-full h-20 rounded-3xl gap-4 text-xl font-black bg-gradient-to-r from-emerald-500 to-emerald-600 text-black hover:from-emerald-400 hover:to-emerald-500 shadow-[0_8px_30px_rgba(16,185,129,0.25)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(16,185,129,0.4)] hover:scale-[1.02]"
            >
              <ArrowRight className="h-6 w-6" />
              CONTINUE — PAY ₹{inrAmount || '0'}
            </Button>
          </div>
        )}

        {/* === STEP 2: PAY VIA UPI === */}
        {step === 'pay' && (
          <div className="p-8 pt-4 space-y-5">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/10 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto border border-blue-500/30">
                  <Zap className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-black text-white">Pay ₹{inrAmount} via UPI</h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Click the button below to open the payment portal</p>
              </div>

              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-bold">Amount</span>
                  <span className="font-black text-white">₹{inrAmount}</span>
                </div>
                <div className="h-px bg-white/5 my-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-bold">You'll receive</span>
                  <span className="font-black text-emerald-400">${usdCredit}</span>
                </div>
                <div className="h-px bg-white/5 my-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-bold">Processing</span>
                  <span className="font-black text-blue-400 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~5-10 Minutes</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                window.open(RAZORPAY_PAGE_URL, '_blank');
                // Auto move to proof step after a small delay
                setTimeout(() => setStep('proof'), 3000);
              }}
              className="w-full h-20 rounded-3xl gap-4 text-xl font-black bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500 shadow-[0_8px_30px_rgba(59,130,246,0.25)] transition-all hover:shadow-[0_8px_40px_rgba(59,130,246,0.4)] hover:scale-[1.02]"
            >
              <ExternalLink className="h-6 w-6" />
              OPEN PAYMENT PORTAL
            </Button>

            <button
              onClick={() => setStep('proof')}
              className="text-xs uppercase tracking-[0.2em] text-blue-400/70 hover:text-blue-400 transition-colors block mx-auto font-black flex items-center gap-2"
            >
              Already Paid? <ArrowRight className="h-3 w-3" /> Submit Proof
            </button>

            <button
              onClick={() => setStep('amount')}
              className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-white transition-colors block mx-auto font-black flex items-center gap-2"
            >
              <ArrowLeft className="h-3 w-3" /> Change Amount
            </button>
          </div>
        )}

        {/* === STEP 3: SUBMIT PROOF === */}
        {step === 'proof' && (
          <div className="p-8 pt-4 space-y-5">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-blue-500/5 border border-emerald-500/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white mb-1">Almost Done!</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-bold">
                    Paste your <span className="text-emerald-400">UTR / Transaction ID</span> and optionally upload a payment screenshot for faster processing.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Badge */}
            <div className="flex items-center justify-center gap-3 py-3 px-6 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-muted-foreground text-xs font-bold">Depositing</span>
              <span className="text-lg font-black text-white">₹{inrAmount}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-black text-emerald-400">${usdCredit}</span>
            </div>

            {/* UTR Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">UTR / Transaction ID *</label>
              <Input
                placeholder="e.g. 412345678901 or pay_xxxxx"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                className="input-3d h-14 font-black text-white px-6 text-base"
              />
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Payment Screenshot (Optional)</label>
              <div className="relative rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all cursor-pointer overflow-hidden">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                {screenshotPreview ? (
                  <div className="p-3 flex items-center gap-4">
                    <img src={screenshotPreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500/30" />
                    <div>
                      <p className="text-sm font-black text-emerald-400">Screenshot Attached ✓</p>
                      <p className="text-[10px] text-muted-foreground font-bold">{screenshot?.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 flex flex-col items-center gap-2">
                    <ImagePlus className="h-8 w-8 text-white/20" />
                    <p className="text-xs font-bold text-muted-foreground">Tap to upload screenshot</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitProof}
              disabled={loading || !paymentId.trim()}
              className="w-full h-20 rounded-3xl gap-4 text-xl font-black bg-gradient-to-r from-emerald-500 to-emerald-600 text-black hover:from-emerald-400 hover:to-emerald-500 shadow-[0_8px_30px_rgba(16,185,129,0.25)] transition-all hover:shadow-[0_8px_40px_rgba(16,185,129,0.4)] hover:scale-[1.02]"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              {loading ? 'VERIFYING...' : 'SUBMIT PAYMENT PROOF'}
            </Button>

            {/* OR Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Help & Support Footer */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  Official Live Support
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-400 border-emerald-500/20 px-2 py-0.5 rounded-lg animate-pulse">
                  ONLINE
                </Badge>
              </div>

              <a
                href={TELEGRAM_SUPPORT}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-3xl bg-gradient-to-br from-[#229ED9]/10 via-[#229ED9]/5 to-transparent border border-[#229ED9]/20 hover:border-[#229ED9]/40 transition-all group scale-100 hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#229ED9]/5"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#229ED9] to-[#128C7E] flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(34,158,217,0.3)] group-hover:rotate-6 transition-transform">
                  <Send className="h-7 w-7 text-white fill-white/20" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-black text-white tracking-tight">Payment Issue? Chat Now</p>
                  <p className="text-[11px] text-[#229ED9] font-black uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                    Live Support <span className="w-1 h-1 rounded-full bg-[#229ED9]" /> @HenryMiller08
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#229ED9]/20 transition-colors">
                  <MessageCircle className="h-5 w-5 text-white/50 group-hover:text-white" />
                </div>
              </a>
              
              <p className="text-center text-[9px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-40">
                Response Time: ~2 Minutes • Verified Service
              </p>
            </div>

            <button
              onClick={() => setStep('pay')}
              className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-white transition-colors block mx-auto font-black flex items-center gap-2"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Payment
            </button>
          </div>
        )}

        {/* === STEP 4: SUCCESS === */}
        {step === 'done' && (
          <div className="p-12 text-center space-y-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="h-14 w-14 text-emerald-400" />
              </div>
              <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '2s' }} />
            </div>

            <div>
              <h3 className="text-3xl font-black text-white mb-2 tracking-tighter">PAYMENT RECEIVED!</h3>
              <p className="text-emerald-400 font-black uppercase tracking-[0.2em] text-xs">Request ID: {paymentId}</p>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 max-w-sm mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-bold">Amount Paid</span>
                <span className="font-black text-white">₹{inrAmount}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-bold">Wallet Credit</span>
                <span className="font-black text-emerald-400">${usdCredit}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-bold">Status</span>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-black uppercase">
                  <Clock className="h-3 w-3 mr-1" /> Processing
                </Badge>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 max-w-sm mx-auto">
              <p className="text-sm font-bold text-blue-200/80 leading-relaxed">
                🎉 Your funds will be credited to your wallet within <span className="text-white font-black">10 minutes</span>.
                You will see the updated balance automatically.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={resetFlow}
                className="bg-white text-black font-black px-10 h-14 rounded-2xl hover:bg-white/90 shadow-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" /> DEPOSIT MORE
              </Button>
              <a href={TELEGRAM_SUPPORT} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="h-14 rounded-2xl border-[#229ED9]/20 text-[#229ED9] hover:bg-[#229ED9]/10 font-black px-8"
                >
                  <Send className="h-4 w-4 mr-2" /> Contact Support
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
