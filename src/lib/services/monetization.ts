import { supabase } from "@/lib/Supabase/browser-client";

interface PlanRow {
  id: string;
  code: string;
  name: string;
  monthly_price_eur: number;
  annual_price_eur: number | null;
  features: string[] | unknown;
  cta_label: string;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  monthlyPriceEur: number;
  annualPriceEur: number | null;
  features: string[];
  ctaLabel: string;
}

function normalizeFeatures(value: PlanRow["features"]): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return [];
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("id,code,name,monthly_price_eur,annual_price_eur,features,cta_label")
    .eq("active", true)
    .order("monthly_price_eur", { ascending: true });

  if (error || !data) {
    return [
      {
        id: "fallback_plus",
        code: "spotly_plus",
        name: "Spotly Plus",
        monthlyPriceEur: 6.99,
        annualPriceEur: 59.99,
        features: [
          "Unlimited trip timelines",
          "Advanced route insights",
          "Priority hotspot alerts",
        ],
        ctaLabel: "Upgrade to Plus",
      },
    ];
  }

  return (data as PlanRow[]).map((plan) => ({
    id: plan.id,
    code: plan.code,
    name: plan.name,
    monthlyPriceEur: Number(plan.monthly_price_eur ?? 0),
    annualPriceEur:
      typeof plan.annual_price_eur === "number"
        ? Number(plan.annual_price_eur)
        : null,
    features: normalizeFeatures(plan.features),
    ctaLabel: plan.cta_label,
  }));
}

