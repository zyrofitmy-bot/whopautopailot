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
    <div className="max-w-md mx-auto my-10 px-4">
      {/* Main Container - Clean Light Design */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        
        {/* Header - Simple & High Contrast */}
        <div className="bg-slate-50/50 p-8 border-b border-slate-100">
            <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                    <IndianRupee className="h-7 w-7 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Deposit Money</h2>
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">Secure UPI Gateway</p>
                </div>
            </div>
        </div>

        {/* STEP 1: SELECT AMOUNT */}
        {step === 'amount' && (
          <div className="p-8 space-y-8">
            <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Quick Select</label>
                <div className="grid grid-cols-3 gap-3">
                    {[500, 1000, 2500].map(amt => (
                        <button
                            key={amt}
                            onClick={() => setInrAmount(String(amt))}
                            className={`py-4 rounded-xl text-lg font-bold transition-all border ${
                                inrAmount === String(amt)
                                ? 'bg-primary border-primary text-white shadow-md'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-primary/50'
                            }`}
                        >
                            ₹{amt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Enter Custom Amount (INR)</label>
                <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black text-3xl">₹</span>
                    <Input
                        type="number"
                        value={inrAmount}
                        onChange={(e) => setInrAmount(e.target.value)}
                        className="pl-14 h-20 rounded-2xl font-black text-4xl text-slate-900 bg-slate-50 border-slate-200 focus:border-primary transition-all placeholder:text-slate-300"
                        placeholder="20"
                    />
                    {usdCredit > 0 && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg text-sm border border-primary/10">
                            ≈ ${usdCredit}
                        </div>
                    )}
                </div>
            </div>

            <Button
              onClick={() => setStep('pay_and_submit')}
              disabled={!inrAmount || Number(inrAmount) < 20}
              className="w-full h-16 rounded-2xl gap-3 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-lg transition-all active:scale-[0.98]"
            >
              Continue to Pay ₹{inrAmount}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* STEP 2: PAY & SUBMIT */}
        {step === 'pay_and_submit' && (
          <div className="p-8 space-y-6">
            
            {/* Payment Section */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-base">1. Make Payment</h3>
                    <div className="text-primary font-black text-lg">₹{inrAmount}</div>
                </div>
                <Button
                    onClick={() => window.open(RAZORPAY_PAGE_URL, '_blank')}
                    className="w-full h-14 rounded-xl gap-2 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition-all"
                >
                    <ExternalLink className="h-4 w-4" />
                    Open Payment App
                </Button>
                <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest leading-loose">
                    Scan or Pay via UPI & Copy UTR Number
                </p>
            </div>

            {/* Submission Section */}
            <div className="space-y-6">
                <h3 className="font-bold text-slate-900 text-base">2. Verify Payment</h3>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">UTR / Transaction ID *</label>
                        <Input
                            placeholder="12-digit number from payment app"
                            value={paymentId}
                            onChange={(e) => setPaymentId(e.target.value)}
                            className="h-12 rounded-xl bg-white border-slate-200 font-bold text-slate-900 px-4 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Screenshot (Optional)</label>
                        <div className="relative h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center group overflow-hidden">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />
                            {screenshotPreview ? (
                                <div className="flex items-center gap-3 w-full px-4">
                                    <img src={screenshotPreview} alt="Proof" className="w-8 h-8 rounded border border-slate-200 shadow-sm" />
                                    <p className="text-xs font-bold text-slate-600 truncate flex-1">{screenshot?.name}</p>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 opacity-60">
                                    <ImagePlus className="h-4 w-4 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attach Proof</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSubmitProof}
                    disabled={loading || !paymentId.trim()}
                    className="w-full h-16 rounded-2xl gap-3 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                    {loading ? 'Verifying...' : 'Submit Verification'}
                </Button>
            </div>

            <button onClick={() => setStep('amount')} className="w-full text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-slate-600 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to Amount Selection
            </button>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'done' && (
          <div className="p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-3xl bg-emerald-500 flex items-center justify-center mx-auto shadow-lg rotate-3">
                <CheckCircle2 className="h-12 w-12 text-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Payment Submitted</h3>
              <p className="text-base font-bold text-emerald-600">Verification in progress (5-10m)</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-sm text-slate-500 font-medium leading-relaxed">
               Your balance will be updated automatically once the transaction is verified by our team.
            </div>

            <Button 
                onClick={() => setStep('amount')} 
                className="w-full h-14 rounded-xl bg-slate-900 text-white font-bold text-base hover:bg-slate-800 shadow-lg"
            >
                Return to Wallet
            </Button>
          </div>
        )}

        {/* Global Footer Support */}
        <div className="p-8 pt-0">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Online</span>
                </div>
                <a href={TELEGRAM_SUPPORT} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-primary/30 transition-all text-xs font-bold text-slate-600">
                    <Send className="h-3.5 w-3.5 text-primary" />
                    Support: @HenryMiller08
                </a>
            </div>
        </div>
      </div>
    </div>
  );
}
