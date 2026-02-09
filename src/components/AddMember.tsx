import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { UserPlus, AlertCircle } from "lucide-react";

export function AddMember({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    aadhaarNumber: "",
    collectionType: "daily" as "daily" | "weekly" | "10 days" | "monthly",
    loanAmount: "",
    amountGiven: "",
    interestPercentage: "1",
    startDate: new Date().toISOString().split("T")[0],
    minPaymentAmount: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-calculation logic for Daily and Weekly only
  useEffect(() => {
    const amount = parseFloat(formData.loanAmount) || 0;

    if (formData.collectionType === "daily") {
      const interest = 1;
      const minPay = (amount * interest) / 100;
      setFormData((prev) => ({
        ...prev,
        interestPercentage: interest.toString(),
        minPaymentAmount: amount > 0 ? minPay.toString() : "",
      }));
    } else if (formData.collectionType === "weekly") {
      const interest = 10;
      const minPay = (amount * interest) / 100;
      setFormData((prev) => ({
        ...prev,
        interestPercentage: interest.toString(),
        minPaymentAmount: amount > 0 ? minPay.toString() : "",
      }));
    }
    // Note: '10 days' and 'monthly' do nothing here, leaving fields for manual entry
  }, [formData.collectionType, formData.loanAmount]);

  const calculateNextDueDate = (startDate: string, type: string) => {
    const date = new Date(startDate);
    if (type === "daily") date.setDate(date.getDate() + 1);
    else if (type === "weekly") date.setDate(date.getDate() + 7);
    else if (type === "10 days") date.setDate(date.getDate() + 10);
    else if (type === "monthly") date.setMonth(date.getMonth() + 1);
    return date.toISOString().split("T")[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.phone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const loanAmount = parseFloat(formData.loanAmount) || 0;
      const amountGiven = parseFloat(formData.amountGiven) || 0;
      const totalPayable = loanAmount;

      const { data: newMember, error: memberError } = await (
        supabase.from("members") as any
      )
        .insert([
          {
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            aadhaar_number: formData.aadhaarNumber,
            loan_amount: loanAmount,
            amount_given: amountGiven,
            collection_type: formData.collectionType,
            total_payable: totalPayable,
            balance_remaining: totalPayable,
            start_date: formData.startDate,
            min_payment_amount: parseFloat(formData.minPaymentAmount) || 0,
            status: "active",
          },
        ])
        .select();

      if (memberError) throw memberError;

      if (newMember && newMember[0]) {
        const nextDate = calculateNextDueDate(
          formData.startDate,
          formData.collectionType,
        );

        const { error: paymentError } = await (
          supabase.from("payments") as any
        ).insert([
          {
            member_id: newMember[0].id,
            paid_amount: 0,
            previous_balance: totalPayable,
            updated_balance: totalPayable,
            paid_date: formData.startDate,
            next_payment_date: nextDate,
          },
        ]);

        if (paymentError) throw paymentError;
      }

      setFormData({
        name: "",
        phone: "",
        address: "",
        aadhaarNumber: "",
        collectionType: "daily",
        loanAmount: "",
        amountGiven: "",
        interestPercentage: "1",
        startDate: new Date().toISOString().split("T")[0],
        minPaymentAmount: "",
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) setFormData({ ...formData, phone: val });
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 12) setFormData({ ...formData, aadhaarNumber: val });
  };

  // Helper to check if fields should be locked
  const isLocked =
    formData.collectionType === "daily" || formData.collectionType === "weekly";

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-green-500/10 rounded-lg">
          <UserPlus className="w-6 h-6 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Add New Member</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50 space-y-4 shadow-xl"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Phone (10 Digits) *
            </label>
            <input
              type="tel"
              required
              placeholder="9876543210"
              value={formData.phone}
              onChange={handlePhoneChange}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Address
            </label>
            <input
              type="text"
              required
              placeholder="Address details"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Aadhaar (12 Digits)
            </label>
            <input
              type="text"
              placeholder="Aadhaar number"
              value={formData.aadhaarNumber}
              onChange={handleAadhaarChange}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Collection Type *
            </label>
            <select
              required
              value={formData.collectionType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  collectionType: e.target.value as any,
                })
              }
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="10 days">10 Days</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Loan Amount *
            </label>
            <input
              type="number"
              required
              placeholder="0.00"
              value={formData.loanAmount}
              onChange={(e) =>
                setFormData({ ...formData, loanAmount: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Amount Given *
            </label>
            <input
              type="number"
              required
              placeholder="0.00"
              value={formData.amountGiven}
              onChange={(e) =>
                setFormData({ ...formData, amountGiven: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Interest Percentage *
            </label>
            <input
              type="number"
              required
              readOnly={isLocked}
              placeholder="0.00"
              value={formData.interestPercentage}
              onChange={(e) =>
                setFormData({ ...formData, interestPercentage: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors ${
                isLocked
                  ? "bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-green-500"
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Min Payment *
            </label>
            <input
              type="number"
              required
              readOnly={isLocked}
              placeholder="0.00"
              value={formData.minPaymentAmount}
              onChange={(e) =>
                setFormData({ ...formData, minPaymentAmount: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors ${
                isLocked
                  ? "bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-green-500"
              }`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-lg shadow-green-900/20"
        >
          {loading ? "Registering..." : "Register Member & Loan"}
        </button>
      </form>
    </div>
  );
}
