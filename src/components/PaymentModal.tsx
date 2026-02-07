import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { X, IndianRupee, Loader2, CheckCircle2 } from "lucide-react";

interface PaymentModalProps {
  loanId: string;
  memberName: string;
  balanceRemaining: number;
  suggestedAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({
  loanId,
  memberName,
  balanceRemaining,
  suggestedAmount,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [amount, setAmount] = useState(suggestedAmount.toString());
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const paidAmount = Number(amount);

    if (isNaN(paidAmount) || paidAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (paidAmount > balanceRemaining) {
      setError("Amount cannot exceed remaining balance");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Fetch member details for the cycle type
      const { data: member, error: fetchError } = await (supabase as any)
        .from("members")
        .select("collection_type, start_date")
        .eq("id", loanId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Fetch the most recent payment to find the next due date
      const { data: lastPayment, error: paymentFetchError } = await (
        supabase as any
      )
        .from("payments")
        .select("next_payment_date")
        .eq("member_id", loanId)
        .order("paid_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paymentFetchError) throw paymentFetchError;

      // 3. Logic to calculate the NEW next_payment_date
      const baseDateStr = lastPayment?.next_payment_date || member.start_date;
      const baseDate = new Date(baseDateStr);
      const nextDate = new Date(baseDate);

      if (member.collection_type?.toLowerCase() === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        nextDate.setDate(nextDate.getDate() + 1);
      }

      const nextDateStr = nextDate.toISOString().split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];
      const newBalance = Math.max(0, balanceRemaining - paidAmount);

      // 4. Record the Payment in 'payments' table
      // Matches your schema: member_id, paid_amount, previous_balance, updated_balance, paid_date, next_payment_date
      const { error: paymentInsertError } = await (supabase as any)
        .from("payments")
        .insert({
          member_id: loanId,
          paid_amount: paidAmount,
          previous_balance: balanceRemaining,
          updated_balance: newBalance,
          paid_date: todayStr,
          next_payment_date: nextDateStr,
        });

      if (paymentInsertError) throw paymentInsertError;

      // 5. Update the member balance and status
      // We do NOT update next_payment_date or last_payment_date here as they aren't in your members schema
      const { error: memberUpdateError } = await (supabase as any)
        .from("members")
        .update({
          balance_remaining: newBalance,
          status: newBalance <= 0 ? "completed" : "active",
        })
        .eq("id", loanId);

      if (memberUpdateError) throw memberUpdateError;

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error("Payment Error:", err);
      setError(err.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        {isSuccess ? (
          <div className="p-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-500/20 p-4 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">Payment Recorded!</h3>
            <p className="text-gray-400">Database updated successfully.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
              <div>
                <h3 className="text-xl font-bold text-white">{memberName}</h3>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">
                  Collect Payment
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  Amount Received (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500 w-5 h-5" />
                  <input
                    autoFocus
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl py-4 pl-12 pr-4 text-2xl font-black text-white focus:border-cyan-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-2xl border border-gray-700">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">
                    Current Balance
                  </p>
                  <p className="text-white font-bold">
                    ₹{balanceRemaining.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-2xl border border-gray-700">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">
                    New Balance
                  </p>
                  <p className="text-cyan-400 font-bold">
                    ₹
                    {Math.max(
                      0,
                      balanceRemaining - Number(amount || 0),
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "Confirm Collection"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
