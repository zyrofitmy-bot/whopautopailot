import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Zap, IndianRupee, ExternalLink, ArrowLeft,
  CheckCircle2, ShieldCheck, Upload, Send, Sparkles,
  Clock, ImagePlus, ArrowRight, MessageCircle, Wallet,
  Info, Smartphone, Copy
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
  const [step, setStep] = useState<'amount' | 'payment' | 'done'>('amount');

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

    if (!user?.id) {
      toast({ title: 'Not Authenticated', description: 'Please log in to submit proof.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const ext = screenshot.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('payment-proofs')
          .upload(path, screenshot, { upsert: true });

        if (uploadErr) {
          console.error('Upload error:', uploadErr);
          throw new Error(`Screenshot upload failed: ${uploadErr.message}`);
        }

        if (uploadData) {
          const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(path);
          screenshotUrl = urlData.publicUrl;
        }
      }

      const descriptionObj = {
        text: `Paid: ₹${inrAmount} | Name: ${fullName} | Email: ${email} | Credit: $${usdCredit}`,
        screenshot_url: screenshotUrl,
      };

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'deposit',
        amount: usdCredit,
        balance_after: 0,
        status: 'pending',
        payment_method: 'razorpay_manual',
        payment_reference: paymentId,
        description: JSON.stringify(descriptionObj),
      });

      if (error) {
        console.error('Insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Send Telegram Notification to Admin (non-blocking)
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

      setStep('done');
      toast({ title: 'Success!', description: 'Your deposit proof has been submitted.' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (err: any) {
      console.error('Submission failed:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
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
  };

  return (
    <div className="relative group/card">
      <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/20 via-emerald-500/10 to-blue-500/20 rounded-[2.5rem] blur-2xl opacity-100 transition duration-1000"></div>

      <div className="three-d-card overflow-hidden mt-6 relative border border-white/10 bg-[#0A0A0B]/80 backdrop-blur-xl">
        {/* Header */}
        <div className="p-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-[0_8px_20px_rgba(16,185,129,0.3)]">
                <IndianRupee className="h-7 w-7 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-white">Deposit Funds</h2>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
                   <Clock className="h-3 w-3" /> Processing: 5-10 mins
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-2 px-4 rounded-xl font-black uppercase tracking-[0.1em] shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 mr-2" />
              Verified Service
            </Badge>
          </div>
        </div>

        {/* === STEP 1: ENTER AMOUNT === */}
        {step === 'amount' && (
          <div className="p-8 pt-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
                <div className="flex items-center gap-4 text-emerald-400/80 mb-2">
                    <Info className="h-4 w-4" />
                    <p className="text-[11px] font-black uppercase tracking-widest">Select an amount to add</p>
                </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {[100, 500, 1000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setInrAmount(String(amt))}
                    className={`py-4 rounded-2xl text-lg font-black transition-all duration-300 border-2 ${
                      inrAmount === String(amt)
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'bg-white/[0.01] border-white/5 text-white/40 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <span className="absolute left-7 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-4xl">₹</span>
                  <Input
                    type="number"
                    value={inrAmount}
                    onChange={(e) => setInrAmount(e.target.value)}
                    className="pl-14 input-3d h-28 font-black text-4xl text-white bg-white/[0.02] border-white/10 rounded-[2rem] focus:border-emerald-500/50 shadow-inner"
                    placeholder="Min: 20"
                  />
                  {usdCredit > 0 && (
                    <div className="absolute right-7 top-1/2 -translate-y-1/2 font-black text-emerald-400 bg-emerald-500/10 px-6 py-3 rounded-2xl text-xl border border-emerald-500/20">
                      = ${usdCredit}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep('payment')}
              disabled={!inrAmount || Number(inrAmount) < 20}
              className="w-full h-24 rounded-[2.5rem] gap-4 text-2xl font-black bg-gradient-to-r from-emerald-500 to-emerald-600 text-black hover:from-emerald-400 hover:to-emerald-500 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] transition-all duration-300 hover:translate-y-[-2px] active:scale-95"
            >
              CONTINUE TO PAY ₹{inrAmount}
              <ArrowRight className="h-7 w-7" />
            </Button>
            
            <p className="text-center text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">100% Secure Payment Gateways</p>
          </div>
        )}

        {/* === STEP 2: PAYMENT & VERIFY === */}
        {step === 'payment' && (
          <div className="p-8 pt-4 space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Step 1: Action */}
            <div className="relative p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 space-y-4 group">
                <div className="absolute -top-3 left-6 px-4 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Step 01</div>
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                        <Smartphone className="h-7 w-7 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">Make Payment</h3>
                        <p className="text-xs text-blue-200/50 font-bold">Open your UPI app and pay exactly ₹{inrAmount}.</p>
                    </div>
                </div>
                
                <Button
                    onClick={() => window.open(RAZORPAY_PAGE_URL, '_blank')}
                    className="w-full h-16 rounded-2xl gap-3 text-lg font-black bg-white text-black hover:bg-white/90 shadow-xl"
                >
                    <ExternalLink className="h-5 w-5" />
                    CLICK HERE TO PAY
                </Button>
            </div>

            {/* Step 2: Proof Details */}
            <div className="relative p-7 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/20 space-y-6">
                <div className="absolute -top-3 left-6 px-4 py-1 bg-emerald-600 text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Step 02</div>
                
                {/* UTR Input */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-emerald-400">UTR / Transaction ID</label>
                        <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase">Required</Badge>
                    </div>
                    <div className="relative">
                        <Input
                            placeholder="Enter 12-digit UTR number"
                            value={paymentId}
                            onChange={(e) => setPaymentId(e.target.value)}
                            className="h-16 rounded-2xl font-black text-xl px-6 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 text-white transition-all shadow-inner"
                        />
                        {paymentId.length >= 10 && <CheckCircle2 className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-emerald-500 animate-in zoom-in" />}
                    </div>
                </div>

                {/* Screenshot Input */}
                <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-emerald-400">Upload Receipt Screenshot</label>
                    <div className="relative h-24 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-emerald-500/30 transition-all cursor-pointer overflow-hidden group/upload">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                        />
                        {screenshotPreview ? (
                            <div className="px-6 flex items-center gap-4 h-full relative z-10 bg-emerald-500/5">
                                <img src={screenshotPreview} alt="Preview" className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500/50" />
                                <div className="flex-1">
                                    <p className="text-sm font-black text-emerald-400">Proof Selected ✅</p>
                                    <p className="text-[10px] text-white/30 truncate">{screenshot?.name}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-1 h-full relative z-10">
                                <ImagePlus className="h-6 w-6 text-white/20 group-hover/upload:text-emerald-400 transition-colors" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover/upload:text-white">Tap to upload proof screenshot</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit button */}
                <Button
                    onClick={handleSubmitProof}
                    disabled={loading || !paymentId.trim()}
                    className="w-full h-20 rounded-[2rem] gap-4 text-xl font-black bg-gradient-to-r from-emerald-500 to-emerald-600 text-black hover:from-emerald-400 hover:to-emerald-500 shadow-2xl transition-all hover:scale-[1.02] active:scale-95 mt-2"
                >
                    {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <ShieldCheck className="h-7 w-7" />}
                    {loading ? 'PROCESSING...' : 'SUBMIT DEPOSIT PROOF'}
                </Button>
            </div>

            <button
                onClick={() => setStep('amount')}
                className="text-xs uppercase font-black tracking-[0.3em] text-white/20 hover:text-white transition-colors block mx-auto flex items-center gap-2"
            >
                <ArrowLeft className="h-3 w-3" /> Back
            </button>
          </div>
        )}

        {/* === STEP 3: SUCCESS === */}
        {step === 'done' && (
          <div className="p-16 text-center space-y-10 animate-in zoom-in-95 duration-700">
            <div className="relative inline-block">
                <div className="w-36 h-36 rounded-[3rem] bg-emerald-500 flex items-center justify-center mx-auto shadow-[0_20px_60px_-10px_rgba(16,185,129,0.5)] rotate-6">
                    <CheckCircle2 className="h-20 w-20 text-black" />
                </div>
                <Sparkles className="absolute -top-4 -right-4 h-12 w-12 text-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-3">
              <h3 className="text-5xl font-black text-white tracking-tighter italic">SUBMITTED!</h3>
              <div className="flex items-center justify-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black px-4 py-1.5 rounded-full text-xs">₹{inrAmount} PROCESSING</Badge>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 space-y-4 max-w-sm mx-auto">
               <p className="text-sm font-bold text-white/60 leading-relaxed">
                  Your deposit request has been received. Our team will verify the payment and credit your wallet within <span className="text-emerald-400 font-black">5-10 minutes</span>.
               </p>
               <div className="h-px bg-white/5" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Please wait for balance to update</p>
            </div>

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button onClick={resetFlow} className="w-full bg-white text-black font-black h-16 rounded-2xl hover:bg-white/90 shadow-xl">
                DEPOSIT MORE
              </Button>
              <a href={TELEGRAM_SUPPORT} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" className="w-full h-16 text-white/40 hover:text-white font-black">
                  <MessageCircle className="h-5 w-5 mr-3" /> Need Help?
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Support Bar */}
        <div className="px-8 pb-8">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Admin Support</span>
                </div>
                <a href={TELEGRAM_SUPPORT} className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border-b border-emerald-500/30 pb-0.5 hover:text-white transition-colors">
                    Chat with @HenryMiller08
                </a>
            </div>
        </div>
      </div>
    </div>
  );
}
