"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import SignatureModal from "@/components/SignatureModal";

interface Flock {
  id: string;
  name: string;
  flock_name: string;
  current_count: number;
  total_birds: number;
  batch_size: number;
  status: string;
  cost_per_bird?: number;
  min_birds_per_investment?: number;
  package_basic_birds?: number;
  package_standard_birds?: number;
  package_premium_birds?: number;
  package_basic_name?: string;
  package_standard_name?: string;
  package_premium_name?: string;
  cost_breakdown?: Record<string, number>;
}

function formatNaira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}th`;
  return `₦${n.toLocaleString()}`;
}

const DEFAULT_BREAKDOWN: Record<string, number> = {
  "Bird Purchase": 800,
  "Feed": 2200,
  "Medication": 350,
  "Operational Fees": 900,
  "Structural Fees": 0,
};

export default function InvestPage() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [selectedFlock, setSelectedFlock] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string>("basic");
  const [costPerBird, setCostPerBird] = useState(4250);
  const [costBreakdown, setBreakdown] = useState<any>(DEFAULT_BREAKDOWN);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementId, setAgreementId] = useState<string | null>(null);
  const [signingAgreement, setSigningAgreement] = useState(false);
  const [showFullAgreement, setShowFullAgreement] = useState(false);
  const [qty, setQty] = useState(1);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signError, setSignError] = useState("");
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setEmail(user.email || "");

        const { data: globalSettings } = await supabase
          .from("settings")
          .select("cost_per_bird, cost_breakdown, package_basic_name, package_standard_name, package_premium_name")
          .single();
        
        const defaultCost = globalSettings?.cost_per_bird || 4250;
        const defaultBreakdown = globalSettings?.cost_breakdown || DEFAULT_BREAKDOWN;
        setCostPerBird(defaultCost);
        setBreakdown(defaultBreakdown);

        const { data: flockData } = await supabase
          .from("flocks")
          .select(
            "id, name, flock_name, current_count, total_birds, batch_size, status, cost_per_bird, min_birds_per_investment, package_basic_birds, package_standard_birds, package_premium_birds, package_basic_name, package_standard_name, package_premium_name, cost_breakdown",
          )
          .eq("status", "active");

        setFlocks(flockData || []);
        if (flockData && flockData.length > 0) {
          const first = flockData[0];
          setSelectedFlock(first.id);
          if (first.cost_per_bird) setCostPerBird(first.cost_per_bird);
          if (first.cost_breakdown) setBreakdown(first.cost_breakdown);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pageRef.current!.querySelectorAll(".fade-in"),
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out" },
      );
    });
    return () => ctx.revert();
  }, [loading]);

  const activeFlock = flocks.find((fl) => fl.id === selectedFlock);
  const maxCapacity = activeFlock?.current_count || 0;

  useEffect(() => {
    if (activeFlock) {
       const basicBirds = activeFlock.package_basic_birds || 10;
       if (maxCapacity > 0 && maxCapacity < basicBirds && selectedPackage !== "fractional") {
           setSelectedPackage("fractional");
       } else if (maxCapacity >= basicBirds && selectedPackage === "fractional") {
           setSelectedPackage("basic");
       }
    }
  }, [activeFlock, maxCapacity]);

  const packageBirds: Record<string, number> = {
    basic: activeFlock?.package_basic_birds || 10,
    standard: activeFlock?.package_standard_birds || 25,
    premium: activeFlock?.package_premium_birds || 50,
    fractional: maxCapacity,
  };
  const packageNames: Record<string, string> = {
    basic: activeFlock?.package_basic_name || "Basic",
    standard: activeFlock?.package_standard_name || "Standard",
    premium: activeFlock?.package_premium_name || "Premium",
    fractional: "Cleanup (Fractional)",
  };
  
  const selectedBirdsPerPkg = packageBirds[selectedPackage] || 0;
  const maxAllowedQty = Math.max(0, Math.floor(maxCapacity / (selectedBirdsPerPkg || 1)));
  
  // Ensure we don't hold a qty > maxAllowedQty via race conditions or package switching implicitly
  const effectiveQty = Math.min(qty, Math.max(1, maxAllowedQty));
  
  const birdCount = selectedBirdsPerPkg * effectiveQty;
  const totalCost = birdCount * costPerBird;

  async function handleSignAgreement(name: string, email: string) {
    setSigningAgreement(true);
    setSignError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

      if (email.toLowerCase() !== user.email?.toLowerCase() || 
          name.toLowerCase() !== profile?.full_name?.toLowerCase()) {
        setSignError("Verification failed. Name or Email does not match your account record. Please check your profile.");
        setSigningAgreement(false);
        return;
      }

      const res = await fetch("/api/mudarabah/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investor_id: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setAgreementId(data.agreement_id);
        setAgreementAccepted(true);
        setShowSignModal(false);
      } else {
        setSignError(data.error || "Failed to sign agreement. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setSignError("A connection error occurred. Please try again.");
    }
    setSigningAgreement(false);
  }

  async function handleInvest() {
    if (!agreementAccepted || !agreementId) {
      alert("You must sign the Agreement before investing.");
      return;
    }
    const f = flocks.find(fl => fl.id === selectedFlock);
    const max = f?.current_count || 1000;
    
    if (!selectedFlock) {
      alert(`Please select a flock first.`);
      return;
    }
    if (birdCount > max) {
      alert(`Only ${max} birds available in this flock. Please select a smaller package.`);
      return;
    }
    setSubmitting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

    const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor_id: user.id,
          birds_count: birdCount,
          gateway: "paystack",
           email: user.email,
           flock_id: selectedFlock,
           agreement_id: agreementId,
           callback_url: `${window.location.origin}${window.location.pathname.replace(/\/invest$/, '')}/payment/callback`,
         }),
       });
 
       const data = await res.json();
       if (res.ok && data.checkout_url) {
         window.location.href = data.checkout_url;
       } else {
         alert(data.error || data.message || "Failed to initiate payment. Please try again.");
       }
    } catch (err) {
      console.error(err);
      alert("Failed to initiate payment. Please try again.");
    }
    setSubmitting(false);
  }

  const getFlockName = (f: Flock) => f.flock_name || f.name || "Unnamed";
  const getFlockCount = (f: Flock) =>
    f.current_count || f.batch_size || f.total_birds || 0;

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 bg-slate-200 rounded-md w-48 mb-6" />
        <div className="h-64 bg-slate-100 rounded-md" />
      </div>
    );
  }

  return (
    <div ref={pageRef}>
      <div className="mb-6 fade-in">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">
          Invest in a Flock
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Islamic Finance — We strictly follow the Mudarabah Al-Muqayyad model of islamic finance and investment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Flock selector */}
          <div className="fade-in bg-white rounded-md border border-slate-200/80 p-4 md:p-5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Select a Flock
            </label>
            {flocks.length === 0 ? (
              <p className="text-slate-400 text-sm">
                No active flocks available right now. Check back soon!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {flocks.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFlock(f.id);
                      if (f.cost_per_bird) setCostPerBird(f.cost_per_bird);
                      if (f.cost_breakdown) setBreakdown(f.cost_breakdown);
                      // Switch to basic automatically if current selected is out of stock (will handle gracefully in UI anyway)
                    }}
                    className={`text-left p-4 rounded-md border-2 transition-all ${
                      selectedFlock === f.id
                        ? "border-accent bg-accent/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-md flex items-center justify-center ${selectedFlock === f.id ? "bg-accent/10" : "bg-slate-50"}`}
                      >
                        <span
                          className={`material-symbols-outlined text-lg ${selectedFlock === f.id ? "text-accent" : "text-slate-400"}`}
                        >
                          egg_alt
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">
                          {getFlockName(f)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {getFlockCount(f).toLocaleString()} birds in flock
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Investment Package */}
          <div className="fade-in bg-white rounded-md border border-slate-200/80 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Investment Package
              </label>
              {activeFlock && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {maxCapacity.toLocaleString()} birds remaining in flock
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(() => {
                const pkgs = ["basic", "standard", "premium"];
                const basicBirds = activeFlock?.package_basic_birds || 10;
                if (maxCapacity > 0 && maxCapacity < basicBirds) {
                  pkgs.push("fractional");
                }
                return pkgs.map((pkg) => {
                const birds = packageBirds[pkg];
                const pkgCost = birds * costPerBird;
                const outOfStock = birds > maxCapacity;
                const isFractional = pkg === "fractional";
                
                return (
                  <button
                    key={pkg}
                    disabled={outOfStock}
                    onClick={() => { setSelectedPackage(pkg); setQty(1); }}
                    className={`text-left p-3 md:p-4 rounded-md border-2 transition-all ${
                      selectedPackage === pkg
                        ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                        : "border-slate-200 hover:border-slate-300"
                    } ${outOfStock ? "opacity-50 cursor-not-allowed grayscale" : ""} ${isFractional ? "col-span-1 sm:col-span-3 bg-amber-50/50 border-amber-200" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-bold capitalize ${isFractional ? "text-amber-700" : "text-primary"}`}>{packageNames[pkg]}</p>
                      {selectedPackage === pkg && !outOfStock && (
                        <span className="material-symbols-outlined text-sm text-accent">check_circle</span>
                      )}
                    </div>
                    <p className={`text-xl font-mono font-bold mb-1 ${isFractional ? "text-amber-800" : "text-primary"}`}>{birds} Birds</p>
                    <p className="text-xs font-bold text-slate-400">₦{(pkgCost).toLocaleString()}</p>
                    {isFractional && <p className="text-[10px] text-amber-600 mt-2 font-medium">Automatic fractional tier offered because remaining capacity ({maxCapacity} birds) is smaller than standard packages.</p>}
                    {!isFractional && outOfStock ? (
                       <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase">Out of Stock</p>
                    ) : !isFractional ? (
                       <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase bg-emerald-50 inline-block px-1 rounded-sm">Available (Max {Math.floor(maxCapacity/(birds||1))})</p>
                    ) : null}
                  </button>
                );
              })})()}
            </div>
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed bg-slate-50 p-2 rounded-md">
              * Note: Investments are restricted to these packages to simplify cash flow management and maintain Islamic Finance pooling compliance.
            </p>
          </div>

          {/* Payment gateway — only Paystack active */}
          <div className="fade-in bg-white rounded-md border border-slate-200/80 p-4 md:p-5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Paystack — active */}
              <div className="p-4 rounded-md border-2 border-accent bg-accent/5">
                <span className="material-symbols-outlined text-xl mb-2 text-accent">
                  account_balance
                </span>
                <p className="text-sm font-bold text-primary">Paystack</p>
                <p className="text-[10px] text-slate-400">Cards, Bank Transfer, USSD</p>
                <span className="inline-block mt-2 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  Active
                </span>
              </div>
              {/* Flutterwave — unavailable */}
              <div className="p-4 rounded-md border-2 border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed relative">
                <span className="material-symbols-outlined text-xl mb-2 text-slate-300">
                  credit_card
                </span>
                <p className="text-sm font-bold text-slate-400">Flutterwave</p>
                <p className="text-[10px] text-slate-300">
                  Cards, Bank, USSD
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  Unavailable
                </span>
              </div>
              {/* PayPal — unavailable */}
              <div className="p-4 rounded-md border-2 border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed relative">
                <span className="material-symbols-outlined text-xl mb-2 text-slate-300">
                  language
                </span>
                <p className="text-sm font-bold text-slate-400">PayPal</p>
                <p className="text-[10px] text-slate-300">International</p>
                <span className="inline-block mt-2 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  Unavailable
                </span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown — Islamic Finance Transparency */}
          {selectedFlock && (
            <div className="fade-in bg-white rounded-md border border-slate-200/80 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-accent text-lg">info</span>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Estimated Cost Per Bird (Transparency)
                </label>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {Object.entries(costBreakdown).map(([label, value]: [string, any]) => (
                  <div key={label} className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                    <div className="flex items-center gap-1.5 mb-1 opacity-40">
                      <span className="material-symbols-outlined text-[10px]">payments</span>
                      <p className="text-[8px] font-bold uppercase tracking-tight">{label}</p>
                    </div>
                    <p className="text-sm font-mono font-bold text-primary">
                      ₦{Number(value).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 mt-4 leading-relaxed">
                * These are estimated costs. Under Islamic Finance rules, <strong>actual verified costs</strong> will be
                deducted from revenue before profit calculation. All costs are transparent and visible on your dashboard.
              </p>
            </div>
          )}

          {/* Mudarabah Agreement — Required before payment */}
          {selectedFlock && (
            <div className="fade-in bg-white rounded-md border border-slate-200/80 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-emerald-600 text-lg">gavel</span>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Signatory Agreement
                </label>
              </div>

              {/* Agreement Summary */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-md p-4 mb-4">
                <h4 className="text-xs font-bold text-emerald-800 mb-3">Summary of Terms</h4>
                <ul className="space-y-2 text-[11px] text-emerald-700">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-0.5">check_circle</span>
                    <span><strong>Business Scope:</strong> Restricted to broiler chicken farming operations only.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-0.5">check_circle</span>
                    <span><strong>Profit Ratio:</strong> 70% FlockFund / 30% Investor of net profit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-0.5">check_circle</span>
                    <span><strong>Capital Priority:</strong> Your capital is returned first before any profit is calculated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-0.5">warning</span>
                    <span><strong>Loss Liability:</strong> Financial loss from normal operations is borne by the Investor. FlockFund is liable only if negligence is proven</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-0.5">info</span>
                    <span><strong>No Guaranteed Returns:</strong> Returns depend on actual farm performance. Capital may be at risk</span>
                  </li>
                </ul>
              </div>

              {/* Full Agreement Toggle */}
              <button
                onClick={() => setShowFullAgreement(!showFullAgreement)}
                className="text-[10px] font-bold text-accent flex items-center gap-1 mb-3 hover:underline"
              >
                <span className="material-symbols-outlined text-xs">
                  {showFullAgreement ? "expand_less" : "expand_more"}
                </span>
                {showFullAgreement ? "Hide Full Agreement" : "View Full Agreement"}
              </button>
              {showFullAgreement && (
                <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-4 max-h-64 overflow-y-auto">
                  <pre className="text-[10px] text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
{`ISLAMIC FINANCE INVESTMENT AGREEMENT

This agreement is entered into between:
1. The INVESTOR (Capital Provider)
2. FLOCKFUND (Fund Manager / FlockFund International)

STRICT ADHERENCE TO MUDARABAH AL-MUQAYYAD MODEL
We strictly follow the Mudarabah Al-Muqayyad model of Islamic finance and investment in all our operations.

TERMS AND CONDITIONS:

1. BUSINESS SCOPE
   Funds shall be used exclusively for broiler chicken farming operations.

2. PROFIT DISTRIBUTION
   Net profit (revenue minus capital and verified costs) shall be distributed as follows:
   - 70% to FlockFund
   - 30% to the Investor

3. LOSS LIABILITY
   Financial loss from normal operations is borne by the Investor.
   FlockFund is liable only if negligence or breach of protocols is proven.

4. DEFINITION OF NEGLIGENCE
   Includes: failure to follow biosecurity protocols, ignoring veterinary advice,
   misappropriation of funds, gross mismanagement.

5. CAPITAL PRIORITY
   Capital must be returned before any profit calculation.

6. COST TRANSPARENCY
   All costs are itemized, verified, and visible to the Investor.

7. NO GUARANTEED RETURNS
   Returns depend entirely on actual farm performance.`}
                  </pre>
                </div>
              )}

              {/* Agreement Acceptance */}
              {agreementAccepted ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                  <span className="material-symbols-outlined text-emerald-600">verified</span>
                  <div>
                    <p className="text-xs font-bold text-emerald-700">Agreement Signed</p>
                    <p className="text-[9px] text-emerald-500">Your digital signature has been recorded</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSignModal(true)}
                  className="w-full py-3 bg-emerald-600 text-white rounded-md font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">draw</span>
                  I Accept — Sign Agreement
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div className="fade-in">
          <div className="bg-white rounded-md border border-slate-200/80 p-4 md:p-5 sticky top-20">
            <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4">
              Investment Summary
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cost per bird</span>
                <span className="font-mono font-bold text-primary">
                  ₦{costPerBird.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Package Quantity</span>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-md p-0.5">
                  <button onClick={() => setQty(Math.max(1, effectiveQty - 1))} className="w-7 h-7 flex items-center justify-center rounded-sm bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-primary transition-colors">-</button>
                  <span className="font-mono font-bold text-primary w-4 text-center">{effectiveQty}</span>
                  <button disabled={effectiveQty >= maxAllowedQty} onClick={() => setQty(Math.min(maxAllowedQty, effectiveQty + 1))} className="w-7 h-7 flex items-center justify-center rounded-sm bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Birds</span>
                <span className="font-mono font-bold text-primary">
                  {birdCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Gateway</span>
                <span className="font-bold text-primary">Paystack</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between text-base">
                <span className="font-bold text-primary">Total</span>
                <span className="font-mono font-extrabold text-accent text-lg">
                  {formatNaira(totalCost)}
                </span>
              </div>
            </div>

            <button
              onClick={handleInvest}
              disabled={submitting || flocks.length === 0 || !agreementAccepted || effectiveQty === 0 || birdCount > maxCapacity}
              className="w-full py-3 md:py-3.5 bg-accent text-primary rounded-md font-bold text-sm uppercase tracking-wider shadow-md shadow-accent/20 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Processing...
                </>
              ) : !agreementAccepted ? (
                <>
                  <span className="material-symbols-outlined text-lg">lock</span>
                  Sign Agreement
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    shopping_cart
                  </span>
                  Pay Now — Islamic Finance Investment
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-300 text-center mt-3">
              Shariah-compliant investment • Secure payment via Paystack
            </p>

            {/* Risk Disclaimer */}
            <div className="mt-3 p-3 bg-amber-50/50 border border-amber-100 rounded-md">
              <p className="text-[9px] text-amber-700 leading-relaxed">
                <strong>⚠️ Risk Notice:</strong> Returns are not guaranteed and depend on actual farm performance. Your capital may be at risk. Financial loss from normal business operations is borne by the investor.
              </p>
            </div>
          </div>
        </div>
      </div>

      <SignatureModal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        onSign={handleSignAgreement}
        isSigning={signingAgreement}
        error={signError}
      />
    </div>
  );
}
