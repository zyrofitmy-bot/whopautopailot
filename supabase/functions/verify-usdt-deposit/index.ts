import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955".toLowerCase();
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const DEPOSIT_WALLET = "0xA07b34C582F31e70110C59faD70C0395a5BD339f".toLowerCase();

const BSC_RPCS = [
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/",
  "https://bsc-dataseed3.binance.org/",
  "https://bsc-dataseed4.binance.org/",
];

async function callRpc(method: string, params: unknown[]): Promise<unknown> {
  for (const rpc of BSC_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      const json = await res.json();
      if (json.result) return json.result;
    } catch {
      continue;
    }
  }
  throw new Error("All BSC RPCs failed");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { txHash, claimedAmount } = await req.json();

    // Validate txHash format
    if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return new Response(
        JSON.stringify({ error: "Invalid transaction hash format. Expected 0x + 64 hex characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!claimedAmount || Number(claimedAmount) < 1) {
      return new Response(
        JSON.stringify({ error: "Amount must be at least $1" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check duplicate tx hash
    const { data: existing } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("payment_reference", txHash.toLowerCase())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Transaction already processed. Cannot reuse a tx hash." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get receipt from BSC RPC
    const receipt = (await callRpc("eth_getTransactionReceipt", [txHash])) as any;
    if (!receipt) {
      return new Response(
        JSON.stringify({ error: "Transaction not found on BSC. It may still be pending — wait a minute and try again." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (receipt.status !== "0x1") {
      return new Response(
        JSON.stringify({ error: "Transaction failed on BSC chain. Only successful transactions can be credited." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find USDT Transfer log to our deposit wallet
    let transferAmount = 0;
    for (const log of receipt.logs || []) {
      const contractMatch = log.address?.toLowerCase() === USDT_CONTRACT;
      const isTransfer = log.topics?.[0] === TRANSFER_TOPIC;
      const toAddress = log.topics?.[2]
        ? "0x" + log.topics[2].slice(26).toLowerCase()
        : "";
      const toMatch = toAddress === DEPOSIT_WALLET;

      if (contractMatch && isTransfer && toMatch) {
        // Parse amount: USDT on BSC has 18 decimals
        const rawAmount = BigInt(log.data);
        transferAmount = Number(rawAmount) / 1e18;
        break;
      }
    }

    if (transferAmount === 0) {
      return new Response(
        JSON.stringify({ error: "No USDT BEP20 transfer to our wallet found in this transaction. Make sure you sent to the correct address on BNB Smart Chain." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount within $0.01 tolerance
    if (Math.abs(transferAmount - Number(claimedAmount)) > 0.01) {
      return new Response(
        JSON.stringify({
          error: `Amount mismatch. On-chain amount: $${transferAmount.toFixed(4)}, you claimed: $${Number(claimedAmount).toFixed(4)}. Please enter the exact amount.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current wallet balance
    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from("wallets")
      .select("balance, total_deposited, updated_at")
      .eq("user_id", userId)
      .single();

    if (walletErr || !wallet) {
      // Auto-create wallet if missing
      const { data: newWallet, error: createErr } = await supabaseAdmin
        .from("wallets")
        .insert({ user_id: userId, balance: 0, total_deposited: 0, total_spent: 0 })
        .select()
        .single();
      if (createErr || !newWallet) {
        return new Response(
          JSON.stringify({ error: "Wallet not found and could not be created." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const currentBalance = Number(wallet?.balance || 0);
    const currentDeposited = Number(wallet?.total_deposited || 0);
    const newBalance = currentBalance + transferAmount;
    const newTotalDeposited = currentDeposited + transferAmount;

    // Update wallet atomically
    const { error: updateErr } = await supabaseAdmin
      .from("wallets")
      .update({
        balance: newBalance,
        total_deposited: newTotalDeposited,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: "Failed to update wallet balance." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record transaction
    const { error: txErr } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: transferAmount,
      balance_after: newBalance,
      status: "completed",
      payment_method: "usdt_bep20",
      payment_reference: txHash.toLowerCase(),
      description: `USDT BEP20 deposit — ${transferAmount.toFixed(4)} USDT`,
    });

    if (txErr) {
      // Rollback wallet
      await supabaseAdmin
        .from("wallets")
        .update({ balance: currentBalance, total_deposited: currentDeposited })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ error: "Failed to record transaction." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: transferAmount,
        newBalance,
        message: `$${transferAmount.toFixed(2)} USDT deposited successfully!`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("verify-usdt-deposit error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
