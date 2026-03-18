"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Users, 
  Mail, 
  Share2, 
  MapPin, 
  Users2, 
  Star, 
  CheckCircle2, 
  Compass, 
  Globe2,
  BadgeCheck,
  ArrowRight 
} from 'lucide-react';

const mockPartners = [
  { name: 'Local Guides Assoc.', logo: '/placeholder-image.svg' },
  { name: 'Travel Bloggers Network', logo: '/placeholder-image.svg' },
  { name: 'Adventure Gear Co.', logo: '/placeholder-image.svg' },
  { name: 'Explorer Collective', logo: '/placeholder-image.svg' },
  { name: 'Nature Lovers Belgium', logo: '/placeholder-image.svg' },
];

const mockTestimonials = [
  {
    quote: "Partnering with Hidden Gems brought 300+ new explorers to our tours last month!",
    author: 'Sarah, Local Guide',
    partner: 'Local Guides Assoc.'
  },
  {
    quote: "The referral program is genius. We've grown our community by 40% through word-of-mouth!",
    author: "Mike, Adventure Blogger",
    partner: "Travel Bloggers Network"
  },
  {
    quote: "Exclusive deals for Hidden Gems explorers have boosted our sales significantly.",
    author: "Emma, Store Owner",
    partner: "Adventure Gear Co."
  }
];

export default function PartnershipsReferralPage() {
  return (
    <div className="min-h-screen space-y-12 md:space-y-20 py-8 md:py-12 bg-gradient-to-b from-slate-50 to-white">
      {/* 1️⃣ Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#244E41] via-emerald-800 to-emerald-900 text-white">
        <div className="absolute inset-0 md:inset-auto md:right-0 md:w-1/2 h-[60vh] md:h-full bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm" />
        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center lg:px-8 lg:py-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="md:max-w-md lg:max-w-lg space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30 mx-auto lg:mx-0">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Join our community</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              Become a Hidden Gems Partner
            </h1>
            <p className="text-lg md:text-xl text-emerald-100 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Join our community of explorers & partners. Share unique places and grow together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link
                href="/contact"
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 card-lift min-h-[56px]"
              >
                <Mail className="w-5 h-5" />
                Contact Us
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#referral"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-2xl border border-white/30 backdrop-blur-sm transition-all duration-300 min-h-[56px]"
              >
                Explore Referral Program
              </Link>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="hidden lg:block relative h-96"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-2xl backdrop-blur-sm flex items-center justify-center">
              <Users2 className="w-48 h-48 text-white/30 animate-pulse" />
              <Globe2 className="w-32 h-32 text-emerald-300/50 absolute -top-8 -right-8 animate-float" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2️⃣ Partnership Opportunities */}
      <section className="container mx-auto px-4 md:px-8 max-w-6xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20 space-y-8 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Partner With Us</h2>
          <p className="text-xl text-slate-600">Hidden Gems connects explorers with unique local experiences.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              icon: MapPin,
              title: "Local Guides",
              desc: "Reach travelers with authentic experiences. Showcase your tours and hidden spots to our growing explorer community.",
              color: "from-emerald-500 to-teal-500"
            },
            {
              icon: Share2,
              title: "Travel Bloggers",
              desc: "Collaborate for content & visibility. Get featured alongside your best discoveries and drive traffic to your blog.",
              color: "from-blue-500 to-indigo-500"
            },
            {
              icon: BadgeCheck,
              title: "Adventure Gear Shops",
              desc: "Offer exclusive deals to our explorers. Exclusive discounts and bundle offers for Hidden Gems members.",
              color: "from-amber-500 to-orange-500"
            }
          ].map((opportunity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 card-lift cursor-pointer"
              whileHover={{ y: -8 }}
            >
              <div className={`w-20 h-20 bg-gradient-to-br ${opportunity.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <opportunity.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">{opportunity.title}</h3>
              <p className="text-slate-600 leading-relaxed">{opportunity.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3️⃣ Referral Program */}
      <section id="referral" className="container mx-auto px-4 md:px-8 max-w-6xl py-20 bg-gradient-to-b from-emerald-50 to-white rounded-3xl -mx-4 md:-mx-8 lg:mx-auto lg:-mx-0">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20 space-y-8 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Invite your friends</h2>
          <p className="text-xl text-slate-600">Share the adventure and earn rewards</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {[
            {
              number: 1,
              title: "Explore",
              desc: "Find hidden gems on the map and start your adventure journey.",
              icon: MapPin,
              color: "from-emerald-500 to-teal-500"
            },
            {
              number: 2,
              title: "Invite",
              desc: "Share your unique referral code with friends and fellow explorers.",
              icon: Share2,
              color: "from-blue-500 to-indigo-500"
            },
            {
              number: 3,
              title: "Earn",
              desc: "Unlock badges, perks and exclusive rewards for each friend who joins.",
              icon: Star,
              color: "from-amber-500 to-orange-500"
            }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-2xl border border-slate-200 bg-white shadow-lg hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 group"
            >
              <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-all" />
              <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10 group-hover:scale-110 transition-all duration-300`}>
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
        {/* Referral Input */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto text-center space-y-6"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-4">Your Referral Link</p>
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="spotly.app/explore?ref=YOURCODE"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg text-center font-mono tracking-wide"
                readOnly
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            <Link
              href="/contact"
              className="w-full block px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 card-lift min-h-[56px] flex items-center justify-center gap-3"
            >
              <Users2 className="w-5 h-5" />
              Invite Friends Now
            </Link>
          </div>
        </motion.div>
      </section>

      {/* 4️⃣ Testimonials / Partner Logos */}
      <section className="container mx-auto px-4 md:px-8 max-w-6xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20 space-y-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Trusted by explorers & partners</h2>
        </motion.div>
        {/* Partner Logos Carousel */}
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-8 -mx-4 sm:-mx-6 lg:mx-0 lg:pb-0">
          <div className="flex gap-6 px-4 sm:px-6 lg:px-0 snap-mandatory">
            {mockPartners.map((partner, index) => (
              <motion.div
                key={index}
                className="flex-none w-28 h-28 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center snap-center hover:scale-110 transition-transform duration-300 cursor-pointer"
                whileHover={{ scale: 1.05, rotate: 2 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center shadow-md">
                  <Users2 className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-xs text-slate-600 mt-2 text-center px-1 line-clamp-2">{partner.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {mockTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all card-lift"
            >
              <p className="text-slate-600 italic mb-6 leading-relaxed">\\"{testimonial.quote}\\"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{testimonial.author}</p>
                  <p className="text-sm text-emerald-600">{testimonial.partner}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5️⃣ Final CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#244E41] via-emerald-600 to-emerald-500 text-white py-20 md:py-32 px-4">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative z-10 container mx-auto px-4 text-center max-w-2xl space-y-8 md:px-8"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">Start collaborating or invite your friends today</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/contact"
              className="group flex items-center justify-center gap-3 px-10 py-5 bg-white text-emerald-600 font-bold rounded-2xl shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all duration-300 min-h-[60px]"
            >
              <Mail className="w-6 h-6" />
              Contact Us
              <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#referral"
              className="flex items-center justify-center px-10 py-5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-2xl border border-white/30 backdrop-blur-sm transition-all duration-300 min-h-[60px]"
            >
              Invite Friends
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

// ArrowRight component (Lucide doesn't have exact match)
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

