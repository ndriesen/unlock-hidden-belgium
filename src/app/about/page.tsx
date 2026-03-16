"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Share, Heart, Users, Compass, Check, Map, Globe, Users2 } from "lucide-react";
import LoginSlideshow from "@/components/auth/LoginSlideshow";
import { motion } from "framer-motion";
// import Image from "next/image";

// Stats for hero/community
const stats = { hotspots: 150, explorers: 12000 };

export default function AboutPage() {
  return (
    <div className="min-h-screen space-y-12 md:space-y-20 py-8 md:py-12">
      {/* Section 1: Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="absolute inset-0 md:inset-auto md:right-0 md:w-1/2 h-[60vh] md:h-full">
          <LoginSlideshow />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center lg:px-8 lg:py-32">
          <div className="md:max-w-md lg:max-w-lg space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">Hidden Gems Explorer</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              Discover places 
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                most people never find
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Hidden Gems helps explorers discover unique places off the beaten path — from secret viewpoints to magical nature spots and forgotten villages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link
                href="/hotspots"
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 min-h-[56px]"
              >
                <Map className="w-5 h-5" />
                Explore Map
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/add"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-2xl border border-white/30 backdrop-blur-sm transition-all duration-300 min-h-[56px]"
              >
                Add Hidden Gem
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-8 text-sm lg:text-base">
              <div className="text-center"><span className="text-2xl lg:text-3xl font-bold block">{stats.hotspots}+</span> Gems</div>
              <div className="text-center"><span className="text-2xl lg:text-3xl font-bold block">{stats.explorers.toLocaleString()}</span> Explorers</div>
              <div className="text-center"><span className="text-2xl lg:text-3xl font-bold block">100%</span> Free</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Problem */}
      <section className="container mx-auto px-4 md:px-8 max-w-6xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20 space-y-8 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Travel has become predictable</h2>
          <div className="grid md:grid-cols-3 gap-8 text-lg text-slate-700 leading-relaxed">
            <div className="space-y-4 p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <p>Crowded tourist traps where everyone takes the same photo.</p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <p>Repetitive Instagram lists that everyone already knows about.</p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-gray-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Compass className="w-8 h-8 text-white" />
              </div>
              <p>Missing the thrill of real discovery and personal adventure.</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 3: What We Do */}
      <section className="container mx-auto px-4 md:px-8 max-w-6xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-center mb-20 space-y-8 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">What Hidden Gems does</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: "Discover unique places", desc: "Handpicked hidden spots that locals love but tourists miss." },
              { icon: Heart, title: "Save your discoveries", desc: "Build personal collections of your favorite adventures." },
              { icon: Share, title: "Share the magic", desc: "Contribute your finds to help others discover too." }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Section 4: How It Works */}
      <section className="container mx-auto px-4 md:px-8 max-w-6xl relative overflow-hidden py-20 bg-gradient-to-b from-slate-50 to-white">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20 max-w-4xl mx-auto relative z-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How it works</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">Three simple steps to your next adventure</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {[
            { number: 1, icon: MapPin, title: "Explore the map", desc: "Browse hidden gems near you or plan for your next destination." },
            { number: 2, icon: Heart, title: "Save places", desc: "Mark spots you want to visit and build your adventure wishlist." },
            { number: 3, icon: Share, title: "Share discoveries", desc: "Add your favorite finds to help other explorers." }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-2xl border border-slate-200 bg-white shadow-lg hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-2xl -z-10 group-hover:bg-emerald-500/10 blur-sm transition-all" />
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10 group-hover:scale-110 transition-all duration-300">
                <step.icon className="w-10 h-10 text-white" />
              </div>
              <div className="w-16 h-16 bg-white border-4 border-emerald-500 rounded-full flex items-center justify-center mx-auto -mt-8 relative z-20 font-bold text-2xl text-emerald-600 shadow-lg">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-6 mb-4">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 5: Mission */}
      <section className="container mx-auto px-4 md:px-8 max-w-4xl text-center space-y-8 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Compass className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Keep the spirit of exploration alive</h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            We believe adventure shouldn&apos;t follow crowds. Hidden Gems connects explorers who value authenticity, 
            discovery, and sharing the paths less traveled. Every gem added brings us closer to mapping the world&apos;s true wonders.
          </p>
        </motion.div>
      </section>

      {/* Section 6: Community */}
      <section className="container mx-auto px-4 md:px-8 max-w-6xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-8 py-20"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Built for explorers</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-12">
            Join thousands of hikers, travelers, photographers, and adventurers who live for discovery.
          </p>
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-4 max-w-2xl mx-auto mb-12">
            {Array.from({ length: 16 }, (_, i) => (
              <div 
                key={i}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 shadow-md hover:scale-110 transition-transform cursor-pointer relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-all" />
                <div className="w-8 h-8 bg-white rounded-full mx-auto mt-3 shadow-sm" />
              </div>
            ))}
          </div>
          <div className="text-lg text-slate-700 max-w-2xl mx-auto">
            <p>You belong here if you chase sunsets most won&apos;t see and collect stories few will hear.</p>
          </div>
        </motion.div>
      </section>

      {/* Section 7: Final CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 text-white py-20 md:py-32 px-4">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
        <div className="relative z-10 container mx-auto px-4 text-center max-w-2xl space-y-8 md:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">Start exploring</h2>
            <p className="text-xl md:text-2xl text-emerald-100 max-w-xl mx-auto leading-relaxed opacity-90">
              Your next hidden gem is waiting. Join thousands of explorers today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link
                href="/hotspots"
                className="group flex items-center justify-center gap-3 px-10 py-5 bg-white text-emerald-600 font-bold rounded-2xl shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all duration-300 min-h-[60px]"
              >
                <Map className="w-6 h-6" />
                Explore Map
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/add"
                className="flex items-center justify-center px-10 py-5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-2xl border border-white/30 backdrop-blur-sm transition-all duration-300 min-h-[60px]"
              >
                Add Your First Gem
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

