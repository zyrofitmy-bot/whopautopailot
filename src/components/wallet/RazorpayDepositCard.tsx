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
      toast({ title: 'Not Authenticated', description: 'Please log in' });
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

        if (uploadErr) throw new Error(uploadErr.message);

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

      if (error) throw new Error(error.message);

      // Send Telegram Notification
      supabase.functions.invoke('send-telegram-notification', {
        body: {
          message: `NEW DEPOSIT: ₹${inrAmount} | UTR: ${paymentId}`,
          photo_url: screenshotUrl,
        },
      }).catch(console.error);

      setStep('done');
      toast({ title: 'Submitted Successfully' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (err: any) {
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
    <div className="max-w-md mx-auto py-10 antialiased">
      {/* Light Clean Card */}
      <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        {/* Simple Header */}
        <div className="bg-slate-50 p-8 border-b border-slate-100">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <IndianRupee className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Add Money</h2>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Safe & Secure UPI Deposit</p>
                </div>
            </div>
        </div>

        {/* STEP 1: AMOUNT */}
        {step === 'amount' && (
          <div className="p-8 space-y-6 animate-in fade-in duration-500">
            <div className="space-y-4">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Amount (INR)</label>
               <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].map(amt => (
                    <button
                        key={amt}
                        onClick={() => setInrAmount(String(amt))}
                        className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                            inrAmount === String(amt) 
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                    >
                        ₹{amt}
                    </button>
                ))}
               </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Or Enter Custom Amount</label>
                <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl">₹</span>
                    <Input
                        type="number"
                        value={inrAmount}
                        onChange={(e) => setInrAmount(e.target.value)}
                        className="pl-12 h-16 rounded-2xl font-bold text-2xl bg-slate-50 border-slate-100 focus:border-emerald-500/50 transition-all"
                        placeholder="20"
                    />
                    {usdCredit > 0 && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-white bg-slate-800 px-3 py-1 rounded-lg text-sm">
                            = ${usdCredit}
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium px-1">Note: Minimum deposit is ₹20. Credits are added in USD.</p>
            </div>

            <Button
              onClick={() => setStep('payment')}
              disabled={!inrAmount || Number(inrAmount) < 20}
              className="w-full h-16 rounded-2xl gap-3 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl transition-all active:scale-[0.98]"
            >
              Continue to Pay
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* STEP 2: PAY & UPLOAD */}
        {step === 'payment' && (
          <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
            {/* Pay Button Area */}
            <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                    Open Payment App
                </p>
                <Button
                    onClick={() => window.open(RAZORPAY_PAGE_URL, '_blank')}
                    variant="outline"
                    className="w-full h-14 rounded-xl gap-3 border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-50 transition-all"
                >
                    <ExternalLink className="h-4 w-4" />
                    Pay via UPI (GPay/PhonePe)
                </Button>
            </div>

            <div className="h-px bg-slate-100 relative">
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-slate-300 font-black uppercase tracking-widest">THEN</span>
            </div>

            {/* Proof Area */}
            <div className="space-y-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                    Upload Payment Proof
                </p>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">Transaction ID / UTR *</label>
                        <Input
                            placeholder="12-digit number"
                            value={paymentId}
                            onChange={(e) => setPaymentId(e.target.value)}
                            className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold"
                        />
                    </div>

                    <div className="relative rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 flex flex-col items-center gap-2 hover:bg-slate-100 transition-all cursor-pointer group">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {screenshotPreview ? (
                            <div className="flex items-center gap-3 w-full">
                                <img src={screenshotPreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover shadow-md" />
                                <p className="text-xs font-bold text-slate-600 truncate">{screenshot?.name}</p>
                            </div>
                        ) : (
                            <>
                                <ImagePlus className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tap to upload Screenshot</p>
                            </>
                        )}
                    </div>
                </div>

                <Button
                    onClick={handleSubmitProof}
                    disabled={loading || !paymentId.trim()}
                    className="w-full h-16 rounded-2xl gap-3 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                    Confirm Deposit
                </Button>
            </div>

            <button onClick={() => setStep('amount')} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mx-auto flex items-center gap-2">
                <ArrowLeft className="h-3 w-3" /> Go Back
            </button>
          </div>
        )}

        {/* STEP 3: DONE */}
        {step === 'done' && (
          <div className="p-12 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border-4 border-emerald-500/10">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Proof Submitted!</h3>
              <p className="text-sm text-slate-400 font-medium">We are verifying your payment.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 text-sm text-slate-600 font-medium leading-relaxed">
                Thank you for your deposit! Our team will credit your funds within <span className="font-bold text-slate-900">5-10 minutes</span>.
            </div>

            <Button onClick={resetFlow} className="w-full h-14 rounded-xl bg-slate-900 text-white font-bold">
                Finish
            </Button>
          </div>
        )}
      </div>

      {/* Very Simple Help */}
      <div className="mt-8 text-center space-y-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Need Help?</p>
        <div className="flex items-center justify-center gap-6">
            <a href={TELEGRAM_SUPPORT} target="_blank" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Send className="h-4 w-4" />
                <span className="text-xs font-bold">Henry Miller</span>
            </a>
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <a href={TELEGRAM_SUPPORT} target="_blank" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs font-bold">Chat Live</span>
            </a>
        </div>
      </div>
    </div>
  );
}
