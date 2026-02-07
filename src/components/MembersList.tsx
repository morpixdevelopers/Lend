import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Users, Phone, MapPin, IndianRupee, Loader2 } from "lucide-react";
import { PaymentModal } from "./PaymentModal";

interface MemberWithLoan {
  memberId: string;
  memberName: string;
  phone: string;
  address: string;
  loanId: string;
  loanAmount: number;
  amountGiven: number;
  collectionType: string;
  totalPayable: number;
  balanceRemaining: number;
  status: string;
  minPaymentAmount: number;
}

interface MembersListProps {
  onViewMember?: (memberId: string) => void;
}

export function MembersList({ onViewMember }: MembersListProps) {
  const [members, setMembers] = useState<MemberWithLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<MemberWithLoan | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("active");

  useEffect(() => {
    fetchMembers();
  }, [filter]);

  async function fetchMembers() {
    setLoading(true);
    try {
      let query = supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase Error:", error.message);
        setMembers([]);
        return;
      }

      if (data) {
        const membersList: MemberWithLoan[] = data.map((m: any) => ({
          memberId: m.id,
          memberName: m.name,
          phone: m.phone,
          address: m.address || "N/A",
          loanId: m.id,
          loanAmount: Number(m.loan_amount || 0),
          amountGiven: Number(m.amount_given || 0),
          collectionType: m.collection_type || "daily",
          totalPayable: Number(m.total_payable || 0),
          balanceRemaining: Number(m.balance_remaining || 0),
          status: m.status || "active",
          minPaymentAmount: Number(m.min_payment_amount || 0),
        }));

        setMembers(membersList);
      }
    } catch (error) {
      console.error("Critical Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const handlePaymentSuccess = () => {
    setSelectedLoan(null);
    fetchMembers();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <div className="text-gray-400 animate-pulse">
          Fetching members from database...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Members Directory
          </h2>
        </div>

        <div className="inline-flex bg-gray-900 p-1 rounded-xl border border-gray-700">
          {(["all", "active", "closed"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === type
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {members.length === 0 ? (
        <div className="bg-gray-800/50 rounded-2xl p-12 border-2 border-dashed border-gray-700 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-medium text-lg">No records found</h3>
          <p className="text-gray-400 mt-1">
            {filter === "active"
              ? "There are no active members. Add a member to get started."
              : "No records found matching this filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {members.map((member) => {
            const paidSoFar = member.totalPayable - member.balanceRemaining;

            return (
              <div
                key={member.memberId}
                className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-blue-500/50 transition-all shadow-xl cursor-pointer group"
                onClick={() => onViewMember?.(member.memberId)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* 1. Name and Contact Details (Left) */}
                  <div className="flex-1 min-w-[280px] space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        {member.memberName}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                          member.status === "active"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-gray-700 text-gray-400 border border-gray-600"
                        }`}
                      >
                        {member.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                        {member.phone}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        <span className="truncate max-w-[150px]">
                          {member.address}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded uppercase">
                        {member.collectionType}
                      </span>
                      <span className="text-[10px] font-bold bg-gray-700 text-gray-300 px-2 py-0.5 rounded uppercase">
                        MIN: ₹{member.minPaymentAmount}
                      </span>
                    </div>
                  </div>

                  {/* 2. Loan Details (Centered between sections) */}
                  <div className="flex-[0.8] flex items-center justify-around bg-gray-900/30 py-3 px-6 rounded-xl border border-gray-700/50">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-500 uppercase">
                        Total Loan
                      </p>
                      <p className="text-sm font-bold text-white">
                        ₹{member.loanAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-gray-700 mx-2" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-500 uppercase">
                        In Hand Cash
                      </p>
                      <p className="text-sm font-bold text-white">
                        ₹{member.amountGiven.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* 3. Balance and Action (Right) */}
                  <div className="lg:w-64 bg-gray-900/50 p-4 rounded-xl border border-gray-700 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] font-bold uppercase">
                          Balance
                        </span>
                        <span className="text-lg font-black text-blue-400">
                          ₹{member.balanceRemaining.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-gray-500 text-[10px] font-bold uppercase">
                          Paid
                        </span>
                        <span className="text-sm font-bold text-green-400">
                          ₹{paidSoFar.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {member.status === "active" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLoan(member);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                      >
                        <IndianRupee className="w-3.5 h-3.5" /> Collect Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedLoan && (
        <PaymentModal
          loanId={selectedLoan.memberId}
          memberName={selectedLoan.memberName}
          balanceRemaining={selectedLoan.balanceRemaining}
          suggestedAmount={selectedLoan.minPaymentAmount}
          onClose={() => setSelectedLoan(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
