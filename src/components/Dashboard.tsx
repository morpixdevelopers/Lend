import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  IndianRupee,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
  UserCheck,
} from "lucide-react";

interface MemberRow {
  id: string;
  status: string;
  total_payable: number;
  min_payment_amount: number;
  collection_type: string;
  next_payment_date: string | null;
  start_date: string;
  balance_remaining: number;
}

interface PaymentRow {
  member_id: string;
  paid_amount: number;
  paid_date: string;
  next_payment_date: string;
}

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalAmountLent: number;
  totalYetToReceive: number;
  todayToReceive: number;
  todayReceived: number;
  overdueCount: number;
}

interface DashboardProps {
  onViewOverdue: () => void;
  onViewTodayCollection: () => void;
}

export function Dashboard({
  onViewOverdue,
  onViewTodayCollection,
}: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalAmountLent: 0,
    totalYetToReceive: 0,
    todayToReceive: 0,
    todayReceived: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);

      // 1. Get LOCAL Date string (matches database format YYYY-MM-DD)
      const now = new Date();
      const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

      const today = new Date(todayStr);
      today.setHours(0, 0, 0, 0);

      // 2. Fetch Members
      const { data: membersData, error: mError } = await (
        supabase.from("members") as any
      ).select("*");
      if (mError || !membersData) throw mError;
      const allMembers = membersData as MemberRow[];

      // 3. Fetch Payments
      const { data: latestPayments, error: lpError } = await (
        supabase.from("payments") as any
      )
        .select("member_id, next_payment_date, paid_amount, paid_date")
        .order("created_at", { ascending: false });

      if (lpError) throw lpError;
      const payments = (latestPayments || []) as PaymentRow[];

      // Map for the most recent next_payment_date
      const latestNextDateMap = new Map<string, string>();
      payments.forEach((p) => {
        if (!latestNextDateMap.has(p.member_id)) {
          latestNextDateMap.set(p.member_id, p.next_payment_date);
        }
      });

      let totalLent = 0;
      let totalYetToReceive = 0;
      let todayReceived = 0;
      let overdueCountCount = 0;
      let todayToReceiveSum = 0;

      // 4. FIX: Filter payments where paid_date EXACTLY matches today's local string
      todayReceived = payments
        .filter((p) => p.paid_date === todayStr)
        .reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

      allMembers.forEach((member) => {
        totalLent += Number(member.total_payable || 0);

        if (member.status === "active") {
          totalYetToReceive += Number(member.balance_remaining ?? 0);

          const nextDueDateStr =
            latestNextDateMap.get(member.id) ||
            member.next_payment_date ||
            member.start_date;
          const nextDueDate = new Date(nextDueDateStr);
          nextDueDate.setHours(0, 0, 0, 0);

          const isWeekly = member.collection_type?.toLowerCase() === "weekly";

          // STRICT OVERDUE (nextDueDate < today)
          if (nextDueDate.getTime() < today.getTime()) {
            overdueCountCount++;
          }

          // TODAY'S TARGET (Due <= today)
          if (nextDueDate.getTime() <= today.getTime()) {
            const diffTime = today.getTime() - nextDueDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const unitsBehind = isWeekly ? Math.floor(diffDays / 7) : diffDays;

            // Check what they paid TODAY specifically
            const paidToday = payments
              .filter(
                (p) => p.member_id === member.id && p.paid_date === todayStr,
              )
              .reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

            const totalTarget =
              Number(member.min_payment_amount || 0) * (unitsBehind + 1);
            todayToReceiveSum += Math.max(0, totalTarget - paidToday);
          }
        }
      });

      setStats({
        totalMembers: allMembers.length,
        activeMembers: allMembers.filter((m) => m.status === "active").length,
        totalAmountLent: totalLent,
        totalYetToReceive,
        todayToReceive: todayToReceiveSum,
        todayReceived,
        overdueCount: overdueCountCount,
      });
    } catch (error) {
      console.error("Dashboard calculation error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-400 font-medium font-black uppercase tracking-tighter">
          Syncing Data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
          Finance Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Total Members"
          value={stats.totalMembers.toString()}
          color="bg-gray-600"
        />
        <StatCard
          icon={<UserCheck className="w-6 h-6" />}
          title="Active Members"
          value={stats.activeMembers.toString()}
          color="bg-blue-600"
        />
        <StatCard
          icon={<IndianRupee className="w-6 h-6" />}
          title="Total Lent"
          value={`₹${stats.totalAmountLent.toLocaleString("en-IN")}`}
          color="bg-indigo-600"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Yet to Receive"
          value={`₹${stats.totalYetToReceive.toLocaleString("en-IN")}`}
          color="bg-emerald-600"
        />
      </div>

      <div className="pt-4">
        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">
          Collection Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onViewTodayCollection}
            className="text-left w-full group"
          >
            <StatCard
              icon={<Calendar className="w-6 h-6" />}
              title="To Receive"
              value={`₹${stats.todayToReceive.toLocaleString("en-IN")}`}
              color="bg-cyan-500"
              clickable
            />
          </button>
          <button
            onClick={onViewTodayCollection}
            className="text-left w-full group"
          >
            <StatCard
              icon={<IndianRupee className="w-6 h-6" />}
              title="Received Today"
              value={`₹${stats.todayReceived.toLocaleString("en-IN")}`}
              color="bg-green-500"
              clickable
            />
          </button>
          <button onClick={onViewOverdue} className="text-left w-full group">
            <StatCard
              icon={<AlertCircle className="w-6 h-6" />}
              title="Overdue Members"
              value={stats.overdueCount.toString()}
              color="bg-red-500"
              clickable
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  color,
  clickable,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
  clickable?: boolean;
}) {
  return (
    <div
      className={`bg-gray-900 border border-gray-800 rounded-3xl p-6 transition-all w-full ${
        clickable
          ? "hover:border-white/20 hover:bg-gray-800 cursor-pointer active:scale-95 shadow-2xl"
          : ""
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className={`${color} p-3 rounded-2xl text-white shadow-xl`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
            {title}
          </p>
          <p className="text-white text-2xl font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}
