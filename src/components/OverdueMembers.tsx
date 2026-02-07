import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Phone, MapPin, Loader2 } from "lucide-react";

interface OverdueMember {
  memberId: string;
  memberName: string;
  phone: string;
  address: string;
  balanceRemaining: number;
  collectionType: string;
  nextDueDate: string;
  daysOverdue: number;
}

interface OverdueMembersProps {
  onViewMember: (memberId: string) => void;
  onBack: () => void;
}

export function OverdueMembers({ onViewMember, onBack }: OverdueMembersProps) {
  const [members, setMembers] = useState<OverdueMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverdueMembers();
  }, []);

  async function fetchOverdueMembers() {
    setLoading(true);
    try {
      // Set 'today' to the start of the current day
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Fetch all active members
      const { data: allMembers, error: mError } = await (supabase as any)
        .from("members")
        .select(
          "id, name, phone, address, balance_remaining, collection_type, start_date",
        )
        .eq("status", "active");

      if (mError) throw mError;

      const overdueList: OverdueMember[] = [];

      // 2. Cross-reference with payments to find those not updated for today
      for (const member of allMembers || []) {
        const { data: lastPayment, error: pError } = await (supabase as any)
          .from("payments")
          .select("next_payment_date")
          .eq("member_id", member.id)
          .order("paid_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pError) continue;

        const nextDueDateStr =
          lastPayment?.next_payment_date || member.start_date;
        const nextDueDate = new Date(nextDueDateStr);
        nextDueDate.setHours(0, 0, 0, 0);

        // FIX: Include today by changing '< today' to '<= today'
        // This ensures Amit Patel (Due Feb 6) shows up until his payment is recorded for Feb 7
        if (nextDueDate < today) {
          const diffTime = today.getTime() - nextDueDate.getTime();
          const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          overdueList.push({
            memberId: member.id,
            memberName: member.name,
            phone: member.phone,
            address: member.address || "N/A",
            balanceRemaining: Number(member.balance_remaining),
            collectionType: member.collection_type,
            nextDueDate: nextDueDateStr,
            daysOverdue: daysOverdue,
          });
        }
      }

      setMembers(overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue));
    } catch (error) {
      console.error("Error fetching overdue members:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        <p className="text-gray-400 font-medium">
          Checking pending collections...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-white">Pending Updates</h2>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-1 rounded-full">
          <span className="text-red-500 text-sm font-bold">
            {members.length} Members
          </span>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center">
          <p className="text-gray-500">
            All member payments are up to date for today.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {members.map((member) => (
            <div
              key={member.memberId}
              onClick={() => onViewMember(member.memberId)}
              className="bg-gray-900 border border-gray-800 hover:border-red-500/50 rounded-3xl p-6 cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                    {member.memberName}
                  </h3>

                  <div className="space-y-1">
                    <div className="flex items-center text-gray-400 text-sm gap-2">
                      <Phone className="w-4 h-4" /> {member.phone}
                    </div>
                    <div className="flex items-center text-gray-400 text-sm gap-2">
                      <MapPin className="w-4 h-4" /> {member.address}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                    Status
                  </p>
                  <p
                    className={`text-2xl font-black ${member.daysOverdue > 0 ? "text-red-500" : "text-cyan-500"}`}
                  >
                    {member.daysOverdue > 0
                      ? `${member.daysOverdue} Days Late`
                      : "Due Today"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-gray-800 pt-4">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    Balance
                  </p>
                  <p className="text-white font-bold">
                    ₹{member.balanceRemaining.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    Scheduled Date
                  </p>
                  <p className="text-gray-300 font-bold">
                    {member.nextDueDate}
                  </p>
                </div>
                <div className="hidden md:block">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    Collection
                  </p>
                  <p className="text-cyan-400 font-bold capitalize">
                    {member.collectionType}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
