import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, CheckCircle2, AlertTriangle, Loader2, ShieldCheck, 
  ArrowLeft, ArrowRight, Zap, Wallet, Sparkles, 
  Clock, Link as LinkIcon, RefreshCw, Send, MessageCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

const DEPOSIT_WALLET = '0xA07b34C582F31e70110C59faD70C0395a5BD339f';
const TELEGRAM_SUPPORT = "https://t.me/HenryMiller08";

export default function InlineDepositCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<'amount' | 'pay' | 'verify' | 'done'>('amount');

  const copyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Address Copied', description: 'USDT (BEP20) address copied to clipboard.' });
  };

  const handleVerify = async () => {
    if (!amount || Number(amount) < 1) {
      toast({ title: 'Invalid amount', description: 'Minimum deposit is $1', variant: 'destructive' });
      return;
    }
    if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      toast({ title: 'Invalid TX hash', description: 'Enter a valid BSC transaction hash (0x + 64 hex chars)', variant: 'destructive' });
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-usdt-deposit', {
        body: { txHash, claimedAmount: Number(amount) },
      });

      let actualError: string | null = data?.error || null;
      if (!actualError && error) {
        try {
          const body = await (error as any).context?.json?.();
          actualError = body?.error || null;
        } catch { }
        actualError = actualError || error.message;
      }
      if (actualError) throw new Error(actualError);

      toast({
        title: '✅ Deposit Verified!',
        description: `$${Number(data.amount).toFixed(2)} USDT added to your wallet successfully.`,
        variant: 'default',
      });

      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (err: any) {
      const msg = err.message || 'Could not verify transaction';
      const friendly = msg.includes('Invalid transaction hash')
        ? '❌ Invalid TX hash. Must start with 0x followed by 64 characters.'
        : msg.includes('Amount must be at least')
          ? '❌ Minimum deposit is $1.'
          : msg.includes('already processed')
            ? '⚠️ This transaction has already been credited.'
            : msg.includes('not found on BSC')
              ? '⏳ Transaction not found yet. Wait 2-3 minutes for confirmation and try again.'
              : msg.includes('failed on chain')
                ? '❌ This transaction failed on BSC chain.'
                : msg.includes('Amount mismatch')
                  ? `❌ ${msg}`
                  : msg.includes('No USDT BEP20 transfer')
                    ? '❌ No USDT transfer to our wallet found. Check the network (BEP20).'
                    : `❌ ${msg}`;

      toast({
        title: 'Verification Failed',
        description: friendly,
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(DEPOSIT_WALLET)}&bgcolor=ffffff&color=000000&margin=20`;

  return (
    <div className="relative group/card">
      <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover/card:opacity-100 transition duration-1000"></div>

      <div className="three-d-card overflow-hidden relative border border-white/10">
        {/* Header */}
        <div className="p-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-500/30 shadow-inner">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-white">USDT Deposit</h2>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-widest opacity-80">Binance Smart Chain (BEP20)</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 py-2 px-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 mr-2" />
              Auto Verification
            </Badge>
          </div>

          {/* Step Indicator */}
          {step !== 'done' && (
            <div className="flex items-center gap-2 mt-6 px-2">
              {['amount', 'pay', 'verify'].map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                    step === s ? 'bg-blue-500 text-white scale-110 shadow-[0_0_20px_rgba(59,130,246,0.4)]' :
                    ['amount', 'pay', 'verify'].indexOf(step) > i ? 'bg-blue-500/20 text-blue-400' :
                    'bg-white/5 text-white/30'
                  }`}>
                    {['amount', 'pay', 'verify'].indexOf(step) > i ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-[2px] rounded-full transition-all duration-500 ${
                      ['amount', 'pay', 'verify'].indexOf(step) > i ? 'bg-blue-500/40' : 'bg-white/5'
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
            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/10 space-y-5">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Wallet className="h-6 w-6 text-blue-400" />
                </div>
                <div className="text-xs text-blue-200/70 leading-relaxed font-extrabold uppercase tracking-tight">
                  Enter the amount of USDT you intend to deposit. Minimum deposit is $1.
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Deposit Amount (USDT)</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-400 font-black text-2xl">$</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-12 input-3d h-20 font-black text-2xl text-white bg-white/5 border-white/10 rounded-[1.5rem]"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep('pay')}
              disabled={!amount || Number(amount) < 1}
              className="w-full h-20 rounded-3xl gap-4 text-xl font-black bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500 shadow-[0_8px_30px_rgba(59,130,246,0.25)] transition-all duration-300 hover:scale-[1.02]"
            >
              <ArrowRight className="h-6 w-6" />
              NEXT: GET WALLET ADDR
            </Button>
          </div>
        )}

        {/* === STEP 2: SEND USDT === */}
        {step === 'pay' && (
          <div className="p-8 pt-4 space-y-6">
            {/* Warning Box */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-200/60 font-black uppercase tracking-widest leading-relaxed">
                Send <span className="text-amber-500">USDT (BEP20) Only.</span> Sending from other networks (ERC20/TRC20) will result in permanent loss.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
              
              {/* QR Code */}
              <div className="flex-shrink-0 flex items-center justify-center relative cursor-zoom-in" onClick={copyAddress}>
                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-40" />
                <img
                  src={qrSrc}
                  alt="USDT Wallet QR"
                  className="w-40 h-40 rounded-3xl relative z-10 border border-white/10 p-4 bg-white shadow-2xl transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="flex-1 space-y-5 justify-center flex flex-col pt-2">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">BSC Wallet Address</p>
                  <div 
                    onClick={copyAddress}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group/copy"
                  >
                    <code className="text-[13px] text-blue-200 font-black break-all flex-1 font-mono tracking-tighter">
                      {DEPOSIT_WALLET}
                    </code>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 group-hover/copy:bg-blue-500/20 shrink-0">
                      {copied ? <CheckCircle2 className="h-5 w-5 text-blue-400" /> : <Copy className="h-5 w-5 text-blue-400/50" />}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap">
                    Confirm: 10+ Block
                  </span>
                  <span className="flex-1" />
                  <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    Network: BEP20
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep('verify')}
              className="w-full h-20 rounded-3xl gap-4 text-xl font-black bg-white text-black hover:bg-white/90 shadow-xl transition-all hover:scale-[1.02]"
            >
              <ArrowRight className="h-6 w-6" />
              SUBMIT TX SIGNATURE
            </Button>

            <button
              onClick={() => setStep('amount')}
              className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-white transition-colors block mx-auto font-black flex items-center gap-2"
            >
              <ArrowLeft className="h-3 w-3" /> Change Amount
            </button>
          </div>
        )}

        {/* === STEP 3: VERIFY TRANSACTION === */}
        {step === 'verify' && (
          <div className="p-8 pt-4 space-y-6">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white mb-1">Blockchain Scan</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-bold">
                    Paste the <span className="text-blue-400">Transaction Hash</span> (TXID) below. Our system will automatically verify it and credit your wallet.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Transaction Hash (TXID) *</label>
                <Input
                  placeholder="0x..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="font-mono text-xs bg-white/[0.02] border-white/10 focus:border-blue-500/40 rounded-xl h-16 px-6"
                />
              </div>
              
              <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                <span>Expected Credit: <span className="text-blue-400">${amount} USDT</span></span>
                <button onClick={() => setStep('pay')} className="hover:text-white flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Retry Payment
                </button>
              </div>
            </div>

            <Button
              onClick={handleVerify}
              disabled={verifying || !txHash}
              className="w-full h-20 rounded-3xl gap-4 text-xl font-black bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500 shadow-[0_8px_30px_rgba(59,130,246,0.25)] transition-all hover:scale-[1.02] disabled:grayscale"
            >
              {verifying ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
              {verifying ? 'SCANNING CHAIN...' : 'INJECT FUNDS TO VAULT'}
            </Button>

            {/* Help & Support Footer */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-blue-500" />
                  Official Live Support
                </span>
                <Badge variant="outline" className="text-[10px] bg-blue-500/5 text-blue-400 border-blue-500/20 px-2 py-0.5 rounded-lg animate-pulse">
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
                  <p className="text-base font-black text-white tracking-tight">Need Support? Chat Now</p>
                  <p className="text-[11px] text-[#229ED9] font-black uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                    Live Chat <span className="w-1 h-1 rounded-full bg-[#229ED9]" /> @HenryMiller08
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#229ED9]/20 transition-colors">
                  <MessageCircle className="h-5 w-5 text-white/50 group-hover:text-white" />
                </div>
              </a>
              
              <p className="text-center text-[9px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-40">
                Guaranteed Response • SECURE DEPOSITS
              </p>
            </div>

            <button
              onClick={() => setStep('pay')}
              className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-white transition-colors block mx-auto font-black flex items-center gap-2"
            >
              <ArrowLeft className="h-3 w-3" /> Show QR Again
            </button>
          </div>
        )}

        {/* === STEP 4: SUCCESS === */}
        {step === 'done' && (
          <div className="p-12 text-center space-y-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(59,130,246,0.2)]">
                <CheckCircle2 className="h-14 w-14 text-blue-400" />
              </div>
              <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: '2s' }} />
            </div>

            <div>
              <h3 className="text-3xl font-black text-white mb-2 tracking-tighter">DEPOSIT CONFIRMED!</h3>
              <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs">Transaction ID: {txHash.slice(0, 10)}...</p>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 max-w-sm mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Added to Wallet</span>
              </div>
              <span className="text-2xl font-black text-emerald-400">${amount} USDT</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={() => { setStep('amount'); setAmount(''); setTxHash(''); }}
                className="bg-white text-black font-black px-10 h-14 rounded-2xl hover:bg-white/90 shadow-lg"
              >
                DONE
              </Button>
              <a href={TELEGRAM_SUPPORT} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="h-14 rounded-2xl border-[#229ED9]/20 text-[#229ED9] hover:bg-[#229ED9]/10 font-black px-8"
                >
                  <Send className="h-4 w-4 mr-2" /> Support
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
