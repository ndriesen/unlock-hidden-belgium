"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  AlertCircle, 
  Sparkles, 
  Users, 
  Mail, 
  MessageSquare, 
  HelpCircle, 
  ArrowRight, 
  Compass, 
  MapPin,
  CheckCircle 
} from "lucide-react";

interface FormData {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    topic: "",
    message: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openFaqs, setOpenFaqs] = useState(new Set(["1"]));

  const topics = [
    "General question",
    "Report location",
    "Feature suggestion",
    "Partnership",
    "Other"
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.topic) newErrors.topic = "Please select a topic";
    if (!formData.message.trim()) newErrors.message = "Message is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setErrors({}); // Clear previous errors

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setFormData({ name: "", email: "", topic: "", message: "" });
      } else {
        // Server error, show as general submit error
        setErrors({ submit: result.error || 'Failed to send message. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
      console.error('Contact form submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({ name: "", email: "", topic: "", message: "" });
    setErrors({});
    setSuccess(false);
  };

  const toggleFaq = (id: string) => {
    const newOpen = new Set(openFaqs);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenFaqs(newOpen);
  };

  const faqs = [
    {
      id: "1",
      question: "How can I add a hidden gem?",
      answer: "You can add a location directly from the map by clicking 'Add hidden gem'. Include photos, description, and why it's special. We'll review it before it goes live to keep quality high."
    },
    {
      id: "2",
      question: "Can I edit a location?",
      answer: "Yes! If you find incorrect information or want to improve a listing, use the 'Report location' form. Fellow explorers help us keep everything accurate and up-to-date."
    },
    {
      id: "3",
      question: "Is Hidden Gems free?",
      answer: "Absolutely 100% free! No subscriptions, no ads, no catch. We're passionate about exploration and want everyone to join the adventure."
    },
    {
      id: "4",
      question: "Can I suggest improvements?",
      answer: "We love feedback from explorers! Use the 'Feature suggestion' option in this form. Every idea helps us build a better platform for discovery."
    }
  ];

  return (
    <>
      {/* SEO Metadata would go in layout, but page-specific */}

<div className="min-h-screen space-y-12 md:space-y-20 py-8 md:py-12">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#244E41] via-emerald-800 to-emerald-900 text-white">
          <div className="absolute inset-0 md:inset-auto md:right-0 md:w-1/2 h-[60vh] md:h-full bg-gradient-to-br from-white/5 to-transparent" />
          <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center lg:px-8 lg:py-32">
            <div className="md:max-w-md lg:max-w-lg space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30 mx-auto lg:mx-0">
                <Compass className="w-4 h-4" />
                <span className="text-sm font-medium">Connect with explorers</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Get in touch
              </h1>
              <p className="text-lg md:text-xl text-emerald-100 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                We'd love to hear from explorers like you. Have a question, suggestion, 
                <br className="hidden md:block" />
                or discovered something amazing?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <button
                  onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 min-h-[56px]"
                >
                  Send a message
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link
                  href="/hotspots"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-2xl border border-white/30 backdrop-blur-sm transition-all duration-300 min-h-[56px]"
                >
                  <MapPin className="w-5 h-5" />
                  Explore the map
                </Link>
              </div>
            </div>
            <div className="hidden lg:block relative h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-2xl backdrop-blur-sm flex items-center justify-center">
                <Compass className="w-48 h-48 text-white/30 animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Contact Options */}
        <section className="container mx-auto px-4 md:px-8 max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20 space-y-8 max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">How can we help?</h2>
            <p className="text-xl text-slate-600">Choose what you&apos;d like to talk about</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MessageCircle, title: "General questions", desc: "Have a question about the platform?", color: "from-blue-500 to-indigo-500" },
              { icon: AlertCircle, title: "Report a location", desc: "Found incorrect information or a duplicate?", color: "from-rose-500 to-pink-500" },
              { icon: Sparkles, title: "Suggest a feature", desc: "Help us improve the explorer experience", color: "from-amber-500 to-orange-500" },
              { icon: Users, title: "Partnerships", desc: "Interested in collaborating?", color: "from-emerald-500 to-teal-500" }
            ].map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                onClick={() => {
                  const topicIndex = topics.indexOf(option.title.toLowerCase().includes('general') ? 'General question' : 
                                                  option.title.toLowerCase().includes('report') ? 'Report location' :
                                                  option.title.toLowerCase().includes('suggest') ? 'Feature suggestion' : 'Partnership');
                  setFormData(prev => ({ ...prev, topic: topics[topicIndex] }));
                  document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${option.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <option.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">{option.title}</h3>
                <p className="text-slate-600 leading-relaxed">{option.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3. Contact Form */}
        <section id="contact-form" className="container mx-auto px-4 md:px-8 max-w-4xl py-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 md:p-12"
          >
            {success ? (
              <div className="text-center space-y-8 py-20">
                <CheckCircle className="w-24 h-24 text-emerald-500 mx-auto" />
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-slate-900">Thanks for reaching out!</h3>
                  <p className="text-xl text-slate-600 max-w-2xl mx-auto">We&apos;ll get back to you soon. Your message means the world to our explorer community.</p>
                </div>
                <button
                  onClick={handleClear}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/50 transition-all"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Send us a message</h2>
                  <p className="text-xl text-slate-600">We read every message from our community</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Your name</label>
                    <div className="relative">
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${errors.name ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-emerald-500'} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                        aria-invalid={!!errors.name}
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${errors.email ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-emerald-500'} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                        aria-invalid={!!errors.email}
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">What&apos;s this about?</label>
                    <div className="relative">
                      <select
                        id="topic"
                        value={formData.topic}
                        onChange={(e) => setFormData({...formData, topic: e.target.value})}
                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${errors.topic ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-emerald-500'} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none`}
                        aria-invalid={!!errors.topic}
                      >
                        <option value="">Select a topic...</option>
                        {topics.map((topic) => (
                          <option key={topic} value={topic}>{topic}</option>
                        ))}
                      </select>
                      <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      {errors.topic && <p className="mt-1 text-sm text-rose-600">{errors.topic}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">Your message</label>
                    <div className="relative">
                      <textarea
                        id="message"
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${errors.message ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-emerald-500'} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-vertical`}
                        aria-invalid={!!errors.message}
                        placeholder="Tell us more about what you need help with..."
                      />
                      <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                      {errors.message && <p className="mt-1 text-sm text-rose-600">{errors.message}</p>}
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                      <p className="text-sm text-rose-700">{errors.submit}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 min-h-[56px] flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send message
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-8 py-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl transition-all duration-200 min-h-[56px]"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </section>

        {/* 4. FAQ Section */}
        <section className="container mx-auto px-4 md:px-8 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20 space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Quick answers</h2>
            <p className="text-xl text-slate-600">Common questions from fellow explorers</p>
          </motion.div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, height: 0 }}
                whileInView={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
                className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-8 text-left hover:bg-slate-50 transition-colors flex items-center justify-between"
                  aria-expanded={openFaqs.has(faq.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{faq.question}</h3>
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${openFaqs.has(faq.id) ? 'bg-emerald-500 rotate-180' : 'bg-slate-200'}`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: openFaqs.has(faq.id) ? 1 : 0, height: openFaqs.has(faq.id) ? "auto" : 0 }}
                  className="overflow-hidden bg-slate-50"
                >
                  <div className="p-8 pt-0 text-slate-700 leading-relaxed">{faq.answer}</div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 5. Final CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#244E41] via-emerald-600 to-emerald-500 text-white py-20 md:py-32 px-4">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative z-10 container mx-auto px-4 text-center max-w-2xl space-y-8 md:px-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">Help uncover the world&apos;s hidden gems</h2>
              <p className="text-xl md:text-2xl text-emerald-100 max-w-xl mx-auto leading-relaxed opacity-90">
                Every message, suggestion and discovery helps make Hidden Gems better for all explorers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Link
                  href="/hotspots"
                  className="group flex items-center justify-center gap-3 px-10 py-5 bg-white text-emerald-600 font-bold rounded-2xl shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all duration-300 min-h-[60px]"
                >
                  <Compass className="w-6 h-6" />
                  Explore Map
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/add"
                  className="flex items-center justify-center px-10 py-5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-2xl border border-white/30 backdrop-blur-sm transition-all duration-300 min-h-[60px]"
                >
                  Add Hidden Gem
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

