import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Loader2,
  Calendar,
  CreditCard,
  Hash,
  TrendingDown,
  CircleDollarSign,
  Wallet,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface MemberInfo {
  id: string;
  name: string;
  phone: string;
  address: string;
  aadhaar_number: string;
  loan_amount: number;
  amount_given: number;
  min_payment_amount: number;
  collection_type: string;
  start_date: string;
  total_payable: number;
  balance_remaining: number;
  status: string;
}

interface Transaction {
  id: string;
  amount: number;
  paymentDate: string;
  updatedBalance: number;
}

export function MemberDetails({
  memberId,
  onBack,
  prevScreen,
}: {
  memberId: string;
  onBack: (target?: string) => void;
  prevScreen?: string;
}) {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMemberDetails();
  }, [memberId]);

  async function fetchMemberDetails() {
    setLoading(true);
    try {
      const { data: memberData } = await supabase
        .from("members")
        .select("*")
        .eq("id", memberId)
        .maybeSingle();

      if (memberData) {
        setMember(memberData);

        const { data: paymentsData } = await supabase
          .from("payments")
          .select("*")
          .eq("member_id", memberId)
          .order("paid_date", { ascending: false });

        if (paymentsData) {
          const formattedTransactions: Transaction[] = paymentsData.map(
            (payment: any) => ({
              id: payment.id,
              amount: Number(payment.paid_amount),
              paymentDate: payment.paid_date,
              updatedBalance: Number(payment.updated_balance),
            }),
          );
          setTransactions(formattedTransactions);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteMember() {
    setIsDeleting(true);
    try {
      // 1. Delete all payments first (foreign key requirement)
      await supabase.from("payments").delete().eq("member_id", memberId);

      // 2. Delete the member
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      // 3. Go back to previous screen
      onBack(prevScreen);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete member. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  if (!member)
    return <div className="text-white text-center p-10">Member not found.</div>;

  const totalPaid = transactions.reduce((s, t) => s + t.amount, 0);

  const getBackLabel = () => {
    if (prevScreen === "dashboard") return "Back to Dashboard";
    if (prevScreen === "collection") return "Back to Today's Collection";
    return "Back to Directory";
  };

  return (
    <div className="space-y-6 relative">
      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-red-900/50 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-500 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Delete Member?
            </h3>
            <p className="text-gray-400 text-sm mb-8">
              This will permanently remove <b>{member.name}</b> and all their
              payment records. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => onBack(prevScreen)}
        className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="mr-2 w-4 h-4" /> {getBackLabel()}
      </button>

      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold">{member.name}</h2>
            <div className="flex flex-wrap gap-y-2 gap-x-6 mt-3 opacity-90 text-sm">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> {member.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {member.address || "No Address"}
              </span>
              <span className="flex items-center gap-1.5">
                <Hash className="w-4 h-4" /> Aadhaar:{" "}
                {member.aadhaar_number || "N/A"}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30">
              {member.status}
            </span>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-100 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-red-500/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Member
            </button>
          </div>
        </div>
      </div>

      {/* Loan Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-sm">
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
            Repayment Target
          </p>
          <p className="text-2xl text-white font-black italic">
            ₹{Number(member.loan_amount).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-sm">
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
            Collected So Far
          </p>
          <p className="text-2xl text-green-400 font-black italic">
            ₹{totalPaid.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-sm">
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
            Pending Balance
          </p>
          <p className="text-2xl text-red-400 font-black italic">
            ₹{Number(member.balance_remaining).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Loan Agreement Details */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-400" />
          <h3 className="text-white font-bold">Loan Agreement Details</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">
              Total Loan Amount
            </p>
            <p className="text-white font-semibold italic">
              ₹{Number(member.loan_amount).toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">
              Hand Cash Given
            </p>
            <p className="text-blue-400 font-semibold italic">
              ₹{Number(member.amount_given).toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">
              INTEREST AMOUNT
            </p>
            <p className="text-white font-semibold">
              ₹{member.min_payment_amount}{" "}
              <span className="text-gray-500 text-[10px]">
                ({member.collection_type})
              </span>
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">
              Start Date
            </p>
            <p className="text-white font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              {new Date(member.start_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Consolidated Transaction History */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-400" />
            Transaction History
          </h3>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            {transactions.length} Payments
          </span>
        </div>

        <div className="divide-y divide-gray-700/50">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 italic">No payments recorded yet.</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 hover:bg-gray-700/20 transition-colors"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3 h-3 text-blue-400" />
                    <p className="text-gray-500 text-[10px] uppercase font-bold">
                      Paid Date
                    </p>
                  </div>
                  <p className="text-white font-semibold italic">
                    {new Date(tx.paymentDate).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <CircleDollarSign className="w-3 h-3 text-green-400" />
                    <p className="text-gray-500 text-[10px] uppercase font-bold">
                      Paid Amount
                    </p>
                  </div>
                  <p className="text-green-400 font-black italic text-lg leading-none">
                    ₹{tx.amount.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-3 h-3 text-blue-400" />
                    <p className="text-gray-500 text-[10px] uppercase font-bold">
                      Updated Balance
                    </p>
                  </div>
                  <p className="text-blue-400 font-black italic text-lg leading-none">
                    ₹{tx.updatedBalance.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
