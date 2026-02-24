'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import gsap from 'gsap';

type VerifyStatus = 'loading' | 'successful' | 'failed' | 'cancelled' | 'error';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const [amount, setAmount] = useState(0);
  const [reference, setReference] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function verify() {
      const transactionId = searchParams.get('transaction_id');
      const txRef = searchParams.get('tx_ref');
      const urlStatus = searchParams.get('status');

      if (!transactionId && !txRef) {
        setStatus('error');
        setMessage('No transaction reference found. Please contact support.');
        return;
      }

      setReference(txRef || transactionId || '');

      try {
        const params = new URLSearchParams();
        if (transactionId) params.set('transaction_id', transactionId);
        if (txRef) params.set('tx_ref', txRef);
        if (urlStatus) params.set('status', urlStatus);

        const res = await fetch(`/api/payments/verify?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setStatus('successful');
          setMessage('Your investment has been confirmed!');
          setAmount(data.amount || 0);
        } else if (data.status === 'cancelled') {
          setStatus('cancelled');
          setMessage('Payment was cancelled. No charges were made.');
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment could not be verified. Please contact support.');
        }
      } catch {
        setStatus('error');
        setMessage('An error occurred while verifying. Please check your dashboard or contact support.');
      }
    }

    verify();
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'loading' && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelector('.result-card'),
          { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' });
      });
      return () => ctx.revert();
    }
  }, [status]);

  const statusConfig: Record<VerifyStatus, { icon: string; color: string; bgColor: string; title: string }> = {
    loading: { icon: 'sync', color: 'text-accent', bgColor: 'bg-accent/10', title: 'Verifying...' },
    successful: { icon: 'check_circle', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10', title: 'Payment Successful' },
    failed: { icon: 'error', color: 'text-rose-600', bgColor: 'bg-rose-500/10', title: 'Payment Failed' },
    cancelled: { icon: 'cancel', color: 'text-amber-600', bgColor: 'bg-amber-500/10', title: 'Payment Cancelled' },
    error: { icon: 'warning', color: 'text-rose-600', bgColor: 'bg-rose-500/10', title: 'Verification Error' },
  };

  const config = statusConfig[status];

  return (
    <div ref={contentRef} className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="result-card w-full max-w-md bg-white rounded-xl border border-slate-200/80 shadow-xl p-6 md:p-8 text-center">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl ${config.bgColor} flex items-center justify-center mx-auto mb-5`}>
          <span className={`material-symbols-outlined text-3xl ${config.color} ${status === 'loading' ? 'animate-spin' : ''}`}
            style={{ fontVariationSettings: "'FILL' 1" }}>
            {config.icon}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-heading font-extrabold text-primary mb-2">{config.title}</h1>
        <p className="text-sm text-slate-400 mb-6">{message}</p>

        {/* Details */}
        {status === 'successful' && amount > 0 && (
          <div className="bg-emerald-50 rounded-lg p-4 mb-6">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Amount Paid</p>
            <p className="text-2xl font-mono font-extrabold text-emerald-700">₦{amount.toLocaleString()}</p>
          </div>
        )}

        {reference && (
          <div className="bg-slate-50 rounded-lg p-3 mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Reference</p>
            <p className="text-xs font-mono text-slate-600 break-all">{reference}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {status === 'successful' ? (
            <button onClick={() => router.push('/investor')}
              className="flex-1 py-3 bg-primary text-white rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">dashboard</span>
              Go to Dashboard
            </button>
          ) : status === 'cancelled' || status === 'failed' ? (
            <>
              <button onClick={() => router.push('/investor/invest')}
                className="flex-1 py-3 bg-accent text-primary rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-accent/80 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">refresh</span>
                Try Again
              </button>
              <button onClick={() => router.push('/investor')}
                className="py-3 px-4 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-slate-200 transition-all">
                Dashboard
              </button>
            </>
          ) : status === 'error' ? (
            <button onClick={() => router.push('/investor')}
              className="flex-1 py-3 bg-slate-100 text-primary rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-slate-200 transition-all">
              Back to Dashboard
            </button>
          ) : null}
        </div>

        {status !== 'loading' && (
          <p className="text-[10px] text-slate-300 text-center mt-4">Need help? Contact support@flockfund.com</p>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
