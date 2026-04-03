import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Zap, IndianRupee, ExternalLink, ArrowLeft,
  CheckCircle2, ShieldCheck, Upload, Send, Sparkles,
  Clock, ImagePlus, ArrowRight, MessageCircle, Wallet,
  Info, Smartphone, AlertCircle, Copy, CreditCard
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';

/* 
  -----------------------------------------------
  PREMIUM DARK DEPOSIT CARD - RE-DESIGNED 2.0
  -----------------------------------------------
*/

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} Copied`, description: `Copied ${text} to clipboard` });
  };

  const handleSubmitProof = async () => {
    if (!inrAmount || Number(inrAmount) < 30) {
      toast({ title: 'Invalid amount', description: 'Minimum deposit is ₹30', variant: 'destructive' });
      return;
    }
    if (!paymentId.trim() || paymentId.length < 8) {
      toast({ title: 'Invalid UTR', description: 'Please enter a valid Transaction ID/UTR', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const ext = screenshot.name.split('.').pop() || 'jpg';
        const path = `deposits/${user?.id}/${Date.now()}.${ext}`;
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
        description: JSON.stringify({ 
          inr_amount: inrAmount, 
          screenshot_url: screenshotUrl,
          type: 'razorpay_manual'
        }),
      });

      if (dbErr) throw dbErr;

      // Notify admin via edge function
      supabase.functions.invoke('send-telegram-notification', {
        body: { 
          title: "🔥 NEW DEPOSIT REQUEST",
          message: `User: ${profile?.full_name || user?.email}\nAmount: ₹${inrAmount} (~$${usdCredit})\nUTR: ${paymentId}`,
          photo_url: screenshotUrl 
        },
      }).catch(console.error);

      setStep('done');
      toast({ title: 'Submission Successful', description: 'Our team will verify your payment shortly.' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (err: any) {
      toast({ title: 'Submission Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 px-4 md:px-0">
      <div className="relative group overflow-hidden rounded-[3rem] border border-white/10 bg-[#030712] shadow-[0_40px_100px_-20px_rgba(0,0,0,1)]">
        
        {/* PROGRESS DECOR */}
        <div className="absolute top-0 left-0 w-full h-1.5 flex gap-1 px-1 pt-1 opacity-50 z-20">
          <div className={`h-full flex-1 rounded-full bg-cyan-500 transition-all duration-700 ${step === 'amount' ? 'flex-[1]' : 'opacity-100'}`} />
          <div className={`h-full flex-1 rounded-full ${['pay_and_submit', 'done'].includes(step) ? 'bg-cyan-500' : 'bg-white/10'} transition-all duration-700`} />
          <div className={`h-full flex-1 rounded-full ${step === 'done' ? 'bg-cyan-500' : 'bg-white/10'} transition-all duration-700`} />
        </div>

        {/* GLOW DECOR */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-1000" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full group-hover:bg-blue-600/20 transition-all duration-1000" />

        <div className="relative z-10">
          {/* HEADER SECTION */}
          <div className="p-8 md:p-12 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center rotate-3 group-hover:rotate-6 transition-transform shadow-[0_15px_40px_rgba(6,182,212,0.4)]">
                    <Wallet className="h-10 w-10 text-black stroke-[2.5]" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-[#030712] flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-black stroke-[3]" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-[1000] text-white tracking-tighter italic uppercase leading-none">Wallet</h1>
                  <p className="text-cyan-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Instant Top-up Indian Gateway
                  </p>
                </div>
              </div>
          </div>

          {/* STEP 1: AMOUNT SELECTION */}
          {step === 'amount' && (
            <div className="p-8 md:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="space-y-6">
                  <div className="flex items-center justify-between pl-1">
                      <label className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Zap className="h-4 w-4 text-cyan-400" />
                        Select Quick Amount
                      </label>
                      <Badge variant="outline" className="text-[10px] font-black border-cyan-500/20 text-cyan-400 bg-cyan-400/5 px-3 py-1">
                        MOST POPULAR
                      </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                      {[500, 1000, 2500].map(amt => (
                          <button
                              key={amt}
                              onClick={() => setInrAmount(String(amt))}
                              className={`group relative py-4 rounded-2xl text-lg font-black transition-all border-2 overflow-hidden ${
                                  inrAmount === String(amt)
                                  ? 'bg-cyan-500 border-cyan-500 text-black shadow-[0_20px_40px_-5px_rgba(6,182,212,0.5)] scale-[1.02]'
                                  : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:text-white hover:bg-white/10'
                              }`}
                          >
                              <div className="relative z-10 flex flex-col items-center">
                                <span className={`text-[9px] uppercase tracking-tighter mb-0.5 font-bold ${inrAmount === String(amt) ? 'text-black/60' : 'text-slate-500'}`}>INR</span>
                                ₹{amt}
                              </div>
                              {inrAmount === String(amt) && (
                                <div className="absolute top-0 right-0 p-1.5">
                                  <Sparkles className="h-4 w-4 text-black opacity-50" />
                                </div>
                              )}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="space-y-6">
                  <label className="text-sm font-black text-white uppercase tracking-widest block ml-1">Manual Amount (INR)</label>
                  <div className="relative group/input">
                      <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter leading-none mb-1">INR</span>
                        <span className="text-5xl font-[1000] text-cyan-400 leading-none">₹</span>
                      </div>
                      
                      <Input
                          type="number"
                          value={inrAmount}
                          onChange={(e) => setInrAmount(e.target.value)}
                          placeholder="0.00"
                          className="h-24 pl-24 md:pl-32 rounded-[2rem] font-black text-4xl md:text-5xl !bg-[#020617] !text-white border-4 border-white/5 focus-visible:ring-0 focus-visible:border-cyan-500 transition-all placeholder:text-slate-600 shadow-[inset_0_4px_30px_rgba(0,0,0,1)] w-full !opacity-100 placeholder-shown:italic"
                      />

                      {usdCredit > 0 && (
                          <div className="absolute right-10 top-1/2 -translate-y-1/2 text-right">
                              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">RECEIVE (USD)</div>
                              <div className="font-black text-2xl text-emerald-400 italic">≈ ${usdCredit}</div>
                          </div>
                      )}
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 justify-center">
                    <Info className="h-3 w-3" />
                    Minimum Deposit: ₹30 • 1 USD ≈ ₹{rates['INR'] || 83.5}
                  </p>
              </div>

              <Button
                onClick={() => setStep('pay_and_submit')}
                disabled={!inrAmount || Number(inrAmount) < 30}
                className="group relative w-full h-20 rounded-[2rem] gap-4 text-xl font-[1000] bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_20px_50px_-10px_rgba(6,182,212,0.6)] transition-all active:scale-95 uppercase italic overflow-hidden"
              >
                <div className="relative z-10 flex items-center gap-3">
                  PROCEED TO PAY ₹{inrAmount}
                  <ArrowRight className="h-8 w-8 stroke-[3] group-hover:translate-x-2 transition-transform" />
                </div>
                <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[45deg] group-hover:animate-[shimmer_1.5s_infinite]" />
              </Button>
            </div>
          )}

          {/* STEP 2: PAYMENT & VERIFICATION */}
          {step === 'pay_and_submit' && (
            <div className="p-8 md:p-12 space-y-12 animate-in slide-in-from-right-10 duration-500">
              
              <div className="bg-white/5 rounded-[3rem] border border-white/10 p-2 overflow-hidden shadow-2xl">
                  {/* INSTRUCTION HEADER */}
                  <div className="bg-[#030712] rounded-[2.5rem] p-10 space-y-10 border border-white/5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div>
                            <h3 className="font-black text-white text-3xl uppercase italic tracking-tighter leading-tight flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg italic notch-clip not-italic font-bold">1</div>
                              Pay Online
                            </h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 ml-14">Safe & Encrypted Link</p>
                          </div>
                          <div className="bg-blue-600 text-white font-black px-10 py-5 rounded-[2rem] text-4xl shadow-[0_15px_40px_-5px_rgba(37,99,235,0.5)] italic self-start md:self-auto">
                            ₹{inrAmount}
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Button
                            onClick={() => window.open(RAZORPAY_PAGE_URL, '_blank')}
                            className="bg-white hover:bg-slate-100 text-black h-24 rounded-3xl gap-4 text-xl font-black shadow-xl group"
                        >
                            <ExternalLink className="h-6 w-6 stroke-[3]" />
                            OPEN PAYMENT 
                        </Button>
                        <Button
                            onClick={() => copyToClipboard(RAZORPAY_PAGE_URL, 'URL')}
                            variant="outline"
                            className="h-24 rounded-3xl gap-4 text-xl font-black border-white/10 bg-white/5 hover:bg-white/10 text-white"
                        >
                           <Copy className="h-6 w-6" />
                           COPY LINK
                        </Button>
                      </div>

                      <div className="flex items-start gap-5 p-8 bg-blue-400/5 rounded-[2rem] border-2 border-blue-400/20">
                          <AlertCircle className="h-8 w-8 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="space-y-1">
                            <p className="text-lg text-white font-black uppercase tracking-tight italic">Warning: Copy UTR ID</p>
                            <p className="text-sm text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                              After payment, you must copy the <span className="text-blue-400">12-Digit UTR/Transaction ID</span> to verify your deposit.
                            </p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* VERIFICATION FORM */}
              <div className="space-y-10 group/form">
                  <div className="flex items-center gap-4 px-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center text-lg italic notch-clip not-italic font-bold">2</div>
                    <h3 className="font-[1000] text-white text-2xl uppercase italic tracking-tighter">Submit Proof</h3>
                  </div>
                  
                  <div className="space-y-8 bg-white/5 p-12 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full" />
                      
                      <div className="space-y-4 relative z-10">
                          <label className="text-[11px] font-[1000] text-slate-500 uppercase tracking-[0.4em] ml-2 block">Transaction ID / UTR *</label>
                          <div className="relative">
                            <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-emerald-500/50" />
                            <Input
                                placeholder="Enter 12-digit ID"
                                value={paymentId}
                                onChange={(e) => setPaymentId(e.target.value)}
                                className="h-16 pl-16 rounded-2xl border-2 border-white/10 bg-[#020617] font-black text-white px-8 text-xl focus-visible:ring-0 focus-visible:border-emerald-500 shadow-2xl w-full !opacity-100 uppercase"
                            />
                          </div>
                      </div>

                      <div className="space-y-4 relative z-10">
                          <label className="text-[11px] font-[1000] text-slate-500 uppercase tracking-[0.4em] ml-2 block">Upload Screenshot (Optional)</label>
                          <div className="relative h-44 rounded-[2.5rem] border-4 border-dashed border-white/10 bg-[#020617] flex items-center justify-center group/upload overflow-hidden transition-all hover:border-emerald-500/50 shadow-inner">
                              <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                              />
                              {screenshotPreview ? (
                                  <div className="flex items-center gap-6 w-full px-12">
                                      <div className="relative">
                                          <img src={screenshotPreview} alt="Proof" className="w-24 h-24 rounded-2xl border-4 border-emerald-500 shadow-2xl object-cover rotate-2" />
                                          <div className="absolute -top-3 -right-3 bg-emerald-500 text-black rounded-full p-1.5 border-2 border-black">
                                              <CheckCircle2 className="h-5 w-5 stroke-[3]" />
                                          </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-xl font-black text-emerald-400 truncate uppercase tracking-tighter italic">{screenshot?.name}</p>
                                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ready to upload</p>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex flex-col items-center gap-4 opacity-50 group-hover/upload:opacity-100 group-hover/upload:scale-110 transition-all duration-300">
                                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <ImagePlus className="h-8 w-8 text-emerald-500" />
                                      </div>
                                      <span className="text-xs font-black text-white uppercase tracking-[0.3em]">Drop Receipt Image</span>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>

                  <Button
                      onClick={handleSubmitProof}
                      disabled={loading || !paymentId.trim()}
                      className="w-full h-16 rounded-2xl gap-4 text-xl font-[1000] bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)] transition-all active:scale-95 uppercase italic overflow-hidden"
                  >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-6 w-6 stroke-[3]" />
                          <span>Verify Deposit</span>
                        </div>
                      )}
                  </Button>
              </div>

              <button 
                onClick={() => setStep('amount')} 
                className="w-full text-xs font-[1000] text-slate-500 uppercase tracking-[0.5em] flex items-center justify-center gap-4 hover:text-white transition-all py-8 group/back"
              >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-2 transition-transform" /> 
                  Re-enter Amount
              </button>
            </div>
          )}

          {/* STEP 3: SUCCESS FEEDBACK */}
          {step === 'done' && (
            <div className="p-16 md:p-32 text-center space-y-12 animate-in zoom-in-95 duration-1000">
              <div className="relative mx-auto w-56 h-56">
                <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] animate-pulse-slow rounded-full" />
                <div className="relative w-full h-full rounded-[4rem] bg-emerald-500 flex items-center justify-center shadow-[0_40px_80px_-10px_rgba(16,185,129,0.7)] rotate-12 border-8 border-black/10">
                    <CheckCircle2 className="h-32 w-32 text-black font-black stroke-[3]" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-emerald-500 text-black px-6 py-1 rounded-full inline-block text-[10px] font-black uppercase tracking-[0.4em] rotate-1">RECEIVED</div>
                <h3 className="text-5xl md:text-6xl font-[1000] text-white tracking-tightest italic uppercase leading-none">Done!</h3>
                <p className="text-lg font-black text-emerald-400 uppercase tracking-widest italic animate-bounce mt-2">Credential Pending...</p>
              </div>

              <div className="bg-white/5 rounded-[3rem] p-12 border border-white/10 text-xl text-slate-300 font-bold leading-relaxed shadow-2xl">
                 Verify success! Your balance will be updated automatically within <span className="text-white underline decoration-emerald-500">5-10 minutes</span>.
              </div>

              <Button onClick={() => setStep('amount')} className="w-full h-16 rounded-2xl bg-white text-black font-[1000] text-lg hover:scale-[1.02] shadow-[0_15px_40px_rgba(255,255,255,0.1)] transition-all uppercase">
                  Let's Continue
              </Button>
            </div>
          )}

          {/* SUPPORT FOOTER */}
          <div className="p-8 md:p-12 pt-0">
              <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10 flex flex-col gap-8 items-center sm:flex-row sm:justify-between shadow-2xl relative overflow-hidden group/footer">
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                  <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse border-4 border-emerald-500/20" />
                        <div className="absolute inset-0 bg-emerald-500/40 blur-sm rounded-full" />
                      </div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Support Team Active</span>
                  </div>
                  <a 
                    href={TELEGRAM_SUPPORT} 
                    target="_blank" 
                    className="flex items-center gap-4 px-10 py-5 rounded-2xl bg-black border border-white/10 hover:border-cyan-500 transition-all group/tg scale-110 shadow-2xl"
                  >
                      <Send className="h-6 w-6 text-cyan-400 group-hover/tg:translate-x-2 group-hover/tg:-translate-y-1 transition-transform" />
                      <span className="text-lg font-black text-white italic tracking-tight">@HenryMiller08</span>
                  </a>
              </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { left: 200%; }
        }
        .notch-clip {
          clip-path: polygon(0% 0%, 100% 0%, 100% 75%, 75% 100%, 0% 100%);
        }
      `}} />
    </div>
  );
}
