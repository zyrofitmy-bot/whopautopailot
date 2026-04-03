import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Zap, IndianRupee, ExternalLink, ArrowLeft,
  CheckCircle2, ShieldCheck, Upload, Send, Sparkles,
  Clock, ImagePlus, ArrowRight, MessageCircle, Wallet,
  Info, Smartphone, AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';

const RAZORPAY_PAGE_URL = "https://razorpay.me/@organicsmm";
const TELEGRAM_SUPPORT = "https://t.me/HenryMiller08";

export default function RazorpayDepositCard() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { rates } = useCurrency();
  const [inrAmount, setInrAmount] = useState('');
  const [usdCredit, setUsdCredit] = useState<number>(0);
  const [paymentId, setPaymentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [step, setStep] = useState<'amount' | 'pay_and_submit' | 'done'>('amount');

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
      toast({ title: 'Missing UTR', description: 'Please enter 12-digit UTR/Transaction ID', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const ext = screenshot.name.split('.').pop() || 'jpg';
        const path = `${user?.id}/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('payment-proofs')
          .upload(path, screenshot, { upsert: true });

        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(path);
        screenshotUrl = urlData.publicUrl;
      }

      const { error: dbErr } = await supabase.from('transactions').insert({
        user_id: user?.id,
        type: 'deposit',
        amount: usdCredit,
        balance_after: 0,
        status: 'pending',
        payment_method: 'razorpay_manual',
        payment_reference: paymentId,
        description: JSON.stringify({ inr_amount: inrAmount, screenshot_url: screenshotUrl }),
      });

      if (dbErr) throw dbErr;

      supabase.functions.invoke('send-telegram-notification', {
        body: { message: `Deposit: ₹${inrAmount} | UTR: ${paymentId}`, photo_url: screenshotUrl },
      }).catch(console.error);

      setStep('done');
      toast({ title: 'Submitted Successfully' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (err: any) {
      toast({ title: 'Submission Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      {/* ── PREMIUM CYBER DARK CONTAINER ── */}
      <div className="bg-[#0a0f1e] border-2 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
        
        {/* HEADER: MASSIVE & CLEAR */}
        <div className="bg-slate-900/50 p-10 border-b border-slate-800/50">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                    <IndianRupee className="h-9 w-9 text-black font-black" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Deposit</h2>
                    <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-[0.3em]">Secure Gateway</p>
                </div>
            </div>
        </div>

        {/* STEP 1: AMOUNT SELECTION (BIG & BOLD) */}
        {step === 'amount' && (
          <div className="p-10 space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest block ml-1">Select Amount</label>
                <div className="grid grid-cols-3 gap-4">
                    {[500, 1000, 2500].map(amt => (
                        <button
                            key={amt}
                            onClick={() => setInrAmount(String(amt))}
                            className={`py-5 rounded-2xl text-xl font-bold transition-all border-2 ${
                                inrAmount === String(amt)
                                ? 'bg-cyan-500 border-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                        >
                            ₹{amt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest block ml-1">Custom Amount</label>
                <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-500 font-black text-4xl">₹</span>
                    <Input
                        type="number"
                        value={inrAmount}
                        onChange={(e) => setInrAmount(e.target.value)}
                        className="pl-16 h-28 rounded-[2rem] font-black text-5xl text-white bg-slate-950 border-slate-800 focus:border-cyan-500 transition-all placeholder:text-slate-800 shadow-inner"
                        placeholder="20"
                    />
                    {usdCredit > 0 && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-cyan-400 bg-cyan-500/10 px-4 py-2 rounded-xl text-xl border border-cyan-500/20">
                            ≈ ${usdCredit}
                        </div>
                    )}
                </div>
            </div>

            <Button
              onClick={() => setStep('pay_and_submit')}
              disabled={!inrAmount || Number(inrAmount) < 20}
              className="w-full h-24 rounded-[2rem] gap-4 text-2xl font-black bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_15px_40px_rgba(6,182,212,0.4)] transition-all active:scale-95"
            >
              PAY ₹{inrAmount}
              <ArrowRight className="h-8 w-8" />
            </Button>
          </div>
        )}

        {/* STEP 2: PAYMENT & VERIFICATION (EXTREMELY VISIBLE) */}
        {step === 'pay_and_submit' && (
          <div className="p-10 space-y-8 animate-in slide-in-from-right-10 duration-500">
            
            {/* INSTRUCTIONS SCREEN */}
            <div className="bg-blue-600/10 border-2 border-blue-500/30 rounded-[2rem] p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-white text-xl uppercase italic">Step 1: Pay</h3>
                    <div className="bg-blue-600 text-white font-black px-4 py-1.5 rounded-xl text-lg shadow-lg">₹{inrAmount}</div>
                </div>
                <Button
                    onClick={() => window.open(RAZORPAY_PAGE_URL, '_blank')}
                    className="w-full h-20 rounded-2xl gap-4 text-xl font-black bg-blue-600 hover:bg-blue-500 text-white shadow-xl transition-all"
                >
                    <ExternalLink className="h-6 w-6" />
                    CLICK TO PAY NOW
                </Button>
                <div className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                    <Info className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                    <p className="text-[12px] text-blue-100 font-bold leading-relaxed">
                        After paying, please copy the <span className="text-white underline">12-Digit UTR Number</span> from your app history.
                    </p>
                </div>
            </div>

            {/* VERIFICATION FORM */}
            <div className="space-y-8">
                <h3 className="font-black text-white text-xl uppercase italic ml-2">Step 2: Submit Proof</h3>
                
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Transaction ID / UTR *</label>
                        <Input
                            placeholder="Enter 12-digit UTR"
                            value={paymentId}
                            onChange={(e) => setPaymentId(e.target.value)}
                            className="h-16 rounded-2xl bg-black border-2 border-slate-700 font-black text-white px-6 text-xl focus:border-cyan-500 shadow-lg"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Screenshot (Must be clear)</label>
                        <div className="relative h-24 rounded-2xl border-2 border-dashed border-slate-700 bg-black flex items-center justify-center group overflow-hidden transition-colors hover:border-cyan-500/50">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />
                            {screenshotPreview ? (
                                <div className="flex items-center gap-5 w-full px-6">
                                    <div className="relative">
                                        <img src={screenshotPreview} alt="Proof" className="w-14 h-14 rounded-xl border-2 border-cyan-500 shadow-xl object-cover" />
                                        <CheckCircle2 className="absolute -top-2 -right-2 h-6 w-6 text-emerald-500 bg-black rounded-full" />
                                    </div>
                                    <p className="text-sm font-black text-cyan-400 truncate flex-1 uppercase tracking-tighter">{screenshot?.name}</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <ImagePlus className="h-8 w-8 text-white" />
                                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Upload Payment Image</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSubmitProof}
                    disabled={loading || !paymentId.trim()}
                    className="w-full h-24 rounded-[2rem] gap-4 text-2xl font-black bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all"
                >
                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <ShieldCheck className="h-8 w-8" />}
                    {loading ? 'SUBMITTING...' : 'CONFIRM DEPOSIT'}
                </Button>
            </div>

            <button onClick={() => setStep('amount')} className="w-full text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:text-white transition-colors py-4">
                <ArrowLeft className="h-5 w-5" /> RE-ENTER AMOUNT
            </button>
          </div>
        )}

        {/* STEP 3: SUCCESS (MASSIVE FEEDBACK) */}
        {step === 'done' && (
          <div className="p-20 text-center space-y-10 animate-in zoom-in-95 duration-700">
            <div className="w-40 h-40 rounded-[3rem] bg-emerald-500 flex items-center justify-center mx-auto shadow-[0_30px_60px_-10px_rgba(16,185,129,0.5)] rotate-6 border-4 border-black/20">
                <CheckCircle2 className="h-24 w-24 text-black font-black" />
            </div>

            <div className="space-y-4">
              <h3 className="text-6xl font-[1000] text-white tracking-tighter italic">SUCCESS!</h3>
              <p className="text-2xl font-black text-emerald-400 uppercase tracking-widest">Added in 5-10 Mins</p>
            </div>

            <div className="bg-black/40 rounded-[2.5rem] p-10 border border-white/5 text-lg text-slate-300 font-bold leading-relaxed">
               Verification in progress. Keep an eye on your wallet balance.
            </div>

            <Button onClick={() => setStep('amount')} className="w-full h-20 rounded-2xl bg-white text-black font-black text-xl hover:bg-slate-100 shadow-2xl transition-all">
                DONE, BACK TO WORK
            </Button>
          </div>
        )}

        {/* SUPPORT FOOTER */}
        <div className="p-10 pt-0">
            <div className="p-8 rounded-[2.5rem] bg-slate-900/50 border border-slate-800/50 flex flex-col gap-6 items-center sm:flex-row sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse border-4 border-emerald-500/20" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Support Online</span>
                </div>
                <a href={TELEGRAM_SUPPORT} target="_blank" className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-black border border-slate-800 hover:border-cyan-500 transition-all group scale-105">
                    <Send className="h-5 w-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    <span className="text-sm font-black text-white italic">@HenryMiller08</span>
                </a>
            </div>
        </div>
      </div>
    </div>
  );
}
