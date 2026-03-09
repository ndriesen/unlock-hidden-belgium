"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSubscriptionPlans, SubscriptionPlan } from "@/lib/services/monetization";

function formatEur(value: number): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const data = await fetchSubscriptionPlans();
      if (active) {
        setPlans(data);
        setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Monetization</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Spotly Plus</h1>
        <p className="mt-2 text-sm text-slate-600">
          Unlock deeper travel insights, richer planning tools and premium social discovery.
        </p>
      </section>

      {loading && <p className="text-sm text-slate-600">Loading plans...</p>}

      {!loading && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">{plan.name}</p>
              <p className="text-3xl font-bold text-slate-900">{formatEur(plan.monthlyPriceEur)}</p>
              <p className="text-xs text-slate-500">per month</p>
              {plan.annualPriceEur !== null && (
                <p className="text-sm text-slate-700">Annual: {formatEur(plan.annualPriceEur)}</p>
              )}

              <div className="space-y-1 text-sm text-slate-700">
                {plan.features.map((feature) => (
                  <p key={feature}>• {feature}</p>
                ))}
              </div>

              <button className="w-full rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white">
                {plan.ctaLabel}
              </button>
            </article>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-700">
        Revenue accelerators:
        <p>• Contextual upgrade prompts on trips/hotspots pages.</p>
        <p>• Sponsored placements for premium partners.</p>
        <p>• Affiliate links for bookings, activities and restaurants.</p>
        <p>• Creator monetization on popular public trips.</p>

        <div className="mt-3">
          <Link href="/hotspots" className="text-sm font-semibold text-emerald-700">
            Return to Explore
          </Link>
        </div>
      </section>
    </div>
  );
}

