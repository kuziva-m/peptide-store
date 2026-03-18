import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Trash2,
  Tag,
  Lock,
  User,
  Percent,
  TrendingUp,
  DollarSign,
} from "lucide-react";

export default function CreatorManager() {
  const [affiliates, setAffiliates] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // New Affiliate Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [commission, setCommission] = useState("15");
  const [pin, setPin] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [affiliatesRes, ordersRes] = await Promise.all([
        supabase
          .from("affiliates")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("discount_code, total_price")
          .not("discount_code", "is", null),
      ]);

      if (affiliatesRes.data) setAffiliates(affiliatesRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
    } catch (error) {
      console.error("Error fetching creator data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAffiliate = async (e) => {
    e.preventDefault();
    const rate = parseFloat(commission) / 100;

    const { error } = await supabase.from("affiliates").insert([
      {
        name: name.trim(),
        discount_code: code.trim().toUpperCase(),
        commission_rate: rate,
        pin: pin.trim(),
      },
    ]);

    if (error) {
      alert(`Error adding creator: ${error.message}`);
    } else {
      setIsAdding(false);
      setName("");
      setCode("");
      setCommission("15");
      setPin("");
      fetchData();
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this creator? They will lose access to their portal.",
      )
    )
      return;

    await supabase.from("affiliates").delete().eq("id", id);
    fetchData();
  };

  // Helper to calculate stats per affiliate
  const getAffiliateStats = (discountCode) => {
    const affiliateOrders = orders.filter(
      (o) =>
        o.discount_code &&
        o.discount_code.toUpperCase() === discountCode.toUpperCase(),
    );
    const totalSales = affiliateOrders.reduce(
      (sum, order) => sum + Number(order.total_price || 0),
      0,
    );
    return { usageCount: affiliateOrders.length, totalSales };
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading creators...</div>
    );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Creator Studio Management
          </h2>
          <p className="text-sm text-gray-500">
            Manage influencer codes, commissions, and track global payouts.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> {isAdding ? "Cancel" : "Add Creator"}
        </button>
      </div>

      {isAdding && (
        <div className="p-6 border-b border-gray-200 bg-blue-50">
          <form
            onSubmit={handleAddAffiliate}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl"
          >
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Creator Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Fitness"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Discount Code (Unique)
              </label>
              <div className="relative">
                <Tag
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SARAH15"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Commission Rate (%)
              </label>
              <div className="relative">
                <Percent
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="15"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Login PIN (For their dashboard)
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700"
              >
                Save Creator
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-bold">Creator</th>
              <th className="p-4 font-bold">Code & PIN</th>
              <th className="p-4 font-bold">Commission</th>
              <th className="p-4 font-bold">Total Sales</th>
              <th className="p-4 font-bold">Owed to Creator</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {affiliates.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  No creators added yet.
                </td>
              </tr>
            ) : (
              affiliates.map((aff) => {
                const stats = getAffiliateStats(aff.discount_code);
                const totalPayout = stats.totalSales * aff.commission_rate;

                return (
                  <tr key={aff.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      {aff.name}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-1">
                        {aff.discount_code}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Lock size={10} /> PIN: {aff.pin}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {(aff.commission_rate * 100).toFixed(0)}%
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900">
                        ${stats.totalSales.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {stats.usageCount} orders
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-green-600 flex items-center gap-1">
                        <DollarSign size={14} />
                        {totalPayout.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(aff.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
