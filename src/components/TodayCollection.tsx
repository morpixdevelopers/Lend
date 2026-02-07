import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Calendar, Phone, Loader2, AlertCircle, Clock } from "lucide-react";
import { PaymentModal } from "./PaymentModal";

interface MemberRow {
  id: string;
  name: string;
  phone: string;
  collection_type: string;
  min_payment_amount: number;
  total_payable: number;
  status: string;
  next_payment_date: string | null;
  start_date: string;
  balance_remaining?: number;
}

interface CollectionItem {
  memberId: string;
  memberName: string;
  phone: string;
  collectionType: string;
  todayAmount: number;
  balanceRemaining: number;
  hasPaidToday: boolean;
  isOverdue: boolean;
  daysBehind: number;
  calculatedNextDate: string;
}

export function TodayCollection({
  onPaymentSuccess,
  onViewMember,
}: {
  onPaymentSuccess: () => void;
  onViewMember: (id: string) => void;
}) {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<CollectionItem | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "daily" | "weekly" | "overdue"
  >("all");

  useEffect(() => {
    fetchTodayCollections();
  }, []);

  async function fetchTodayCollections() {
    try {
      setLoading(true);
      const now = new Date();
      const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
      const todayTimestamp = new Date(todayStr).getTime();

      const { data: members, error: mError } = await (
        supabase.from("members") as any
      )
        .select("*")
        .eq("status", "active");
      if (mError || !members) throw mError;

      const { data: latestPayments, error: pError } = await (
        supabase.from("payments") as any
      )
        .select("member_id, paid_amount, paid_date, next_payment_date")
        .order("created_at", { ascending: false });

      if (pError) throw pError;

      const paidTodayMap = new Map<string, number>();
      const latestNextDateMap = new Map<string, string>();

      (latestPayments || []).forEach((p: any) => {
        if (p.paid_date === todayStr) {
          const current = paidTodayMap.get(p.member_id) || 0;
          paidTodayMap.set(p.member_id, current + Number(p.paid_amount));
        }
        if (!latestNextDateMap.has(p.member_id)) {
          latestNextDateMap.set(p.member_id, p.next_payment_date);
        }
      });

      const items: CollectionItem[] = (members as MemberRow[])
        .map((m) => {
          const actualPaidToday = paidTodayMap.get(m.id) || 0;
          const hasPaidToday = paidTodayMap.has(m.id);

          const refDateStr =
            latestNextDateMap.get(m.id) || m.next_payment_date || m.start_date;
          const dueDate = new Date(refDateStr);
          dueDate.setHours(0, 0, 0, 0);

          const diffTime = todayTimestamp - dueDate.getTime();
          let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // APPLY +1 CORRECTION: If today is after the due date, we add 1 to include today in the count
          if (diffDays >= 0) {
            diffDays = diffDays + 1;
          }

          const isWeekly = m.collection_type?.toLowerCase() === "weekly";
          // Overdue if diffDays (after +1 correction) is more than 1 for daily, or more than 7 for weekly
          const isOverdue =
            !hasPaidToday && (isWeekly ? diffDays > 7 : diffDays > 1);

          // Multiplier is now directly based on the corrected diffDays
          let multiplier = 1;
          if (diffDays > 0) {
            multiplier = isWeekly
              ? Math.max(1, Math.floor(diffDays / 7))
              : diffDays;
          }

          const displayAmount = hasPaidToday
            ? actualPaidToday
            : m.min_payment_amount * multiplier;

          return {
            memberId: m.id,
            memberName: m.name,
            phone: m.phone,
            collectionType: (m.collection_type || "daily").toLowerCase(),
            todayAmount: displayAmount,
            balanceRemaining: m.balance_remaining ?? m.total_payable,
            hasPaidToday,
            isOverdue: isOverdue,
            daysBehind: diffDays,
            calculatedNextDate: refDateStr,
          };
        })
        .filter((item) => {
          const memberNextTimestamp = new Date(
            item.calculatedNextDate,
          ).setHours(0, 0, 0, 0);
          return item.hasPaidToday || memberNextTimestamp <= todayTimestamp;
        });

      setCollections(items);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = collections.filter((i) => {
    if (activeTab === "all") return true;
    if (activeTab === "overdue") return i.isOverdue;
    return i.collectionType === activeTab;
  });

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-2" />
        <p>Updating Collection List...</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Change: Hidden on mobile (hidden), visible on medium screens and up (md:flex) */}
          <h2 className="hidden md:flex text-2xl font-bold text-white items-center gap-2">
            <Calendar className="text-cyan-500 w-6 h-6" /> Today's Due
          </h2>
          <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-700">
            {["all", "daily", "weekly"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  activeTab === t
                    ? "bg-cyan-600 text-white shadow-lg"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => setActiveTab("overdue")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                activeTab === "overdue"
                  ? "bg-red-600 text-white shadow-lg"
                  : "text-red-500/70 hover:text-red-400"
              }`}
            >
              <Clock className="w-3 h-3" /> Overdue
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-gray-900 px-4 py-2 rounded-xl border border-gray-700 text-center min-w-[120px]">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              To Receive
            </p>
            <p className="text-white text-xl font-black italic">
              ₹
              {filtered
                .filter((x) => !x.hasPaidToday)
                .reduce((sum, item) => sum + item.todayAmount, 0)
                .toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 text-center min-w-[120px]">
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
              Received
            </p>
            <p className="text-emerald-400 text-xl font-black italic">
              ₹
              {filtered
                .filter((x) => x.hasPaidToday)
                .reduce((sum, item) => sum + item.todayAmount, 0)
                .toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-700 text-gray-400">
            {activeTab === "overdue"
              ? "No overdue payments found."
              : "No members due for collection."}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.memberId}
              onClick={() => onViewMember(item.memberId)}
              className={`bg-gray-800 p-6 rounded-xl border transition-all cursor-pointer hover:bg-gray-750 group ${
                item.hasPaidToday
                  ? "border-green-500/30 opacity-60"
                  : "border-gray-700 hover:border-cyan-500/40"
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {item.memberName}
                    </h3>
                    {!item.hasPaidToday && item.isOverdue && (
                      <span className="text-red-500 text-[10px] px-2 py-0.5 rounded font-black uppercase flex items-center gap-1 bg-red-500/10 border border-red-500/20">
                        <AlertCircle className="w-3 h-3" /> Overdue (
                        {item.daysBehind}D)
                      </span>
                    )}
                    {item.hasPaidToday && (
                      <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded uppercase font-black">
                        Paid Today
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm mt-1 flex gap-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-500" /> {item.phone}
                    </span>
                    <span className="bg-gray-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-gray-300">
                      {item.collectionType}
                    </span>
                  </div>
                </div>

                <div
                  className="flex flex-col sm:flex-row items-center gap-8 w-full lg:w-auto justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center sm:text-right">
                    <p className="text-gray-500 text-[10px] font-bold uppercase">
                      {item.hasPaidToday ? "Paid" : "Target"}
                    </p>
                    <p
                      className={`text-2xl font-black ${item.hasPaidToday ? "text-green-400" : "text-cyan-400"}`}
                    >
                      ₹{item.todayAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-gray-500 text-[10px] font-bold uppercase">
                      Balance
                    </p>
                    <p className="text-white font-bold text-lg">
                      ₹{item.balanceRemaining.toLocaleString("en-IN")}
                    </p>
                  </div>
                  {!item.hasPaidToday ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLoan(item);
                      }}
                      className="w-full sm:w-auto px-8 py-2.5 rounded-xl font-bold text-white shadow-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all"
                    >
                      Collect Payment
                    </button>
                  ) : (
                    <div className="w-full sm:w-auto px-8 py-2.5 rounded-xl text-center font-bold bg-gray-900 text-gray-500 border border-gray-700">
                      Received
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedLoan && (
        <PaymentModal
          loanId={selectedLoan.memberId}
          memberName={selectedLoan.memberName}
          balanceRemaining={selectedLoan.balanceRemaining}
          suggestedAmount={selectedLoan.todayAmount}
          onClose={() => setSelectedLoan(null)}
          onSuccess={() => {
            setSelectedLoan(null);
            fetchTodayCollections();
            onPaymentSuccess();
          }}
        />
      )}
    </div>
  );
}
