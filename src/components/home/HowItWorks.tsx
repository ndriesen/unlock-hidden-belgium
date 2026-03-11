"use client";

import { Compass, Footprints, Share2, ArrowRight } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    icon: Compass,
    title: "Discover",
    description: "Explore hidden gems, must-sees, and local favorites near you.",
  },
  {
    icon: Footprints,
    title: "Visit",
    description: "Check in to places you visit and track your adventures.",
  },
  {
    icon: Share2,
    title: "Share",
    description: "Share your discoveries with friends and compete on leaderboards.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            How It Works
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto">
            Start your adventure in three simple steps
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative group text-center"
              >
                {/* Step Number Badge */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-500 text-white font-bold rounded-full flex items-center justify-center text-sm shadow-lg z-10">
                  {index + 1}
                </div>

                {/* Card */}
                <div className="pt-8 pb-6 px-4 rounded-2xl border-2 border-slate-100 bg-white transition-all duration-300 group-hover:border-emerald-200 group-hover:shadow-xl group-hover:-translate-y-1">
                  {/* Icon Circle */}
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <Icon className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow Connector (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href="/hotspots"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/30"
          >
            Start Exploring
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

