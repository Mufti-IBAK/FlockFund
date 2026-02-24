"use client";

import { useState, useEffect } from "react";

export default function AdminFundRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    loadRequests();

    // Realtime subscription
    let channel: any = null;
    async function subscribe() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      channel = supabase
        .channel("admin-requests-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "fund_requests" },
          () => {
            loadRequests();
          },
        )
        .subscribe();
    }
    subscribe();

    return () => {
      if (channel) {
        import("@/lib/supabase/client").then(({ createClient }) => {
          createClient().removeChannel(channel);
        });
      }
    };
  }, []);

  async function loadRequests() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("fund_requests")
        .select(
          "*, flocks(flock_name, name), profiles!fund_requests_requester_id_fkey(full_name, role)",
        )
        .order("created_at", { ascending: false });

      setRequests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approved" | "rejected") {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const { data: requestData, error } = await supabase
        .from("fund_requests")
        .update({
          status: action,
          admin_approved: action === "approved",
          approved_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("requester_id, category, amount")
        .single();

      if (error) throw error;

      // Notify Requester
      if (requestData) {
        await supabase.from("notifications").insert({
          user_id: requestData.requester_id,
          title:
            action === "approved"
              ? "✅ Request Approved"
              : "❌ Request Rejected",
          message: `Your request for ₦${Number(requestData.amount).toLocaleString()} (${requestData.category}) has been ${action}.`,
          type: "system",
          redirect_url: "/keeper/requests",
        });

        // If approved, notify Accountants
        if (action === "approved") {
          const { data: accountants } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", "accountant");
          if (accountants) {
            const accNotifs = accountants.map((acc) => ({
              user_id: acc.id,
              title: "💸 New Disbursement Pending",
              message: `A fund request for ₦${Number(requestData.amount).toLocaleString()} has been approved and is ready for payment.`,
              type: "payment",
              redirect_url: "/accountant/disbursements",
            }));
            await supabase.from("notifications").insert(accNotifs);
          }
        }
      }
      loadRequests();
    } catch (err) {
      console.error(err);
      alert("Action failed");
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Fund Approval Hub
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review and approve operational fund requests from the farm staff
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No pending fund requests.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Flock
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/50 transition-all"
                  >
                    <td className="px-6 py-4 text-[11px] text-slate-400 font-mono">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primary">
                        {req.profiles?.full_name}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-tight">
                        {req.profiles?.role?.replace("_", " ")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {req.flocks?.flock_name || req.flocks?.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                        {req.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-primary text-sm">
                      ₦{Number(req.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {req.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(req.id, "rejected")}
                            className="w-8 h-8 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all"
                            title="Reject"
                          >
                            <span className="material-symbols-outlined text-base">
                              close
                            </span>
                          </button>
                          <button
                            onClick={() => handleAction(req.id, "approved")}
                            className="w-8 h-8 rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:scale-[1.05] flex items-center justify-center transition-all"
                            title="Approve"
                          >
                            <span className="material-symbols-outlined text-base">
                              check
                            </span>
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest ${
                            req.status === "approved"
                              ? "text-emerald-500"
                              : req.status === "processed"
                                ? "text-sky-500"
                                : "text-rose-400"
                          }`}
                        >
                          {req.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
