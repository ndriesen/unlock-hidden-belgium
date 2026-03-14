'use client'

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Search, ScrollText, Download, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LegalDocViewer from "./LegalDocViewer";
import { LegalDoc } from "@/lib/legal";
import Link from "next/link";

interface LegalCenterProps {
  documents: LegalDoc[];
}

export default function LegalCenter({ documents }: LegalCenterProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [activeHash, setActiveHash] = useState(""); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const docRefs = useRef<(HTMLElement | null)[]>([]);

  const sections = [
    {
      id: "terms",
      title: "Legal & Terms",
      docSlugs: ["terms", "acceptable-use-policy", "platform-liability-disclaimer"],
    },
    {
      id: "privacy",
      title: "Privacy",
      docSlugs: ["privacy", "cookie-policy"],
    },
    {
      id: "community",
      title: "Community & Safety",
      docSlugs: ["community-guidelines", "sensitive-location-policy"],
    },
    {
      id: "copyright",
      title: "Copyright & Content Removal",
      docSlugs: ["copyright-policy", "content-removal-policy"],
    },
  ];

  const allDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sectionsWithDocs = sections.map((section) => ({
    ...section,
    docs: allDocs.filter((doc) => section.docSlugs.includes(doc.slug)),
  })).filter((section) => section.docs.length > 0);

  // Handle hash changes for deep linking
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    
    // Check if hash matches a section id
    const matchingSection = sections.find(s => s.id === hash);
    if (matchingSection) {
      setExpandedSection(hash);
      setActiveSection(hash);
      setTimeout(() => {
        const element = document.getElementById(hash);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }
    
    // Check if hash matches a doc slug
    if (hash && documents.find((doc) => doc.slug === hash)) {
      setExpandedDoc(hash);
      setActiveHash(hash);
      // Find parent section and expand it
      const parentSection = sections.find(s => s.docSlugs.includes(hash));
      if (parentSection) {
        setExpandedSection(parentSection.id);
        setActiveSection(parentSection.id);
      }
      setTimeout(() => {
        const element = document.getElementById(hash);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [searchParams, documents, sections]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSection((current) => (current === sectionId ? null : sectionId));
    setActiveSection(sectionId);
    
    // Update URL hash
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${sectionId}`);
    }
    
    // Scroll to section
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
  }, []);

  const toggleDoc = useCallback((slug: string) => {
    setExpandedDoc((current) => (current === slug ? null : slug));
    setActiveHash(slug);
    
    // Update URL hash
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${slug}`);
    }
    
    // Scroll to doc
    setTimeout(() => {
      const element = document.getElementById(slug);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (sectionsWithDocs.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-20 px-4">
        <ScrollText className="w-16 h-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No legal documents found</h2>
        <p className="text-slate-600 mb-8 max-w-md">
          {searchQuery ? "Try adjusting your search terms." : "Legal documents will appear here."}
        </p>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mb-6">
          <AlertCircle className="w-6 h-6 text-emerald-600" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Legal Center
            </h1>
            <p className="text-slate-600 mt-2 text-lg max-w-2xl mx-auto">
              Our policies and terms to keep our community safe and protected
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-12 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search legal documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
          />
        </div>
        {allDocs.length !== documents.length && (
          <p className="text-sm text-slate-500 mt-2 text-center">
            Showing {sectionsWithDocs.length} of {sections.length} sections ({allDocs.length} of {documents.length} docs)
          </p>
        )}
      </div>

      {/* Documents */}
      <div className="space-y-4 px-4 pb-24">
        <AnimatePresence mode="wait">
          {sectionsWithDocs.map((section, sectionIndex) => (
            <motion.section
              key={section.id}
              id={section.id}
              ref={(el) => { sectionRefs.current[sectionIndex] = el; }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`group bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${
                activeSection === section.id ? "ring-2 ring-emerald-400/50 shadow-emerald-400/25" : ""
              }`}
              role="region"
              aria-labelledby={`section-title-${section.id}`}
            >
              {/* Section Header */}
              <motion.button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-10 pr-6 group-hover:bg-slate-50/50 transition-colors"
                aria-expanded={expandedSection === section.id}
                aria-controls={`section-content-${section.id}`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-3 h-14 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-2xl flex-shrink-0" />
                  <div>
                    <h2 id={`section-title-${section.id}`} className="text-3xl font-bold text-slate-900">
                      {section.title}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {section.docs.length} document{section.docs.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedSection === section.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-7 h-7 text-slate-400 group-hover:text-emerald-500" />
                </motion.div>
              </motion.button>

              {/* Section Content */}
              <AnimatePresence>
                {expandedSection === section.id && (
                  <motion.div
                    id={`section-content-${section.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-0">
                      <div className="px-10 pb-10 pt-2 space-y-3">
                        {section.docs.map((doc, docIndex) => (
                          <motion.section
                            key={doc.slug}
                            id={doc.slug}
                            ref={(el) => { docRefs.current[docIndex] = el; }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group/doc bg-slate-50/50 border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 ml-12 pl-4 pr-4 ${
                              activeHash === doc.slug ? "ring-2 ring-emerald-400/30 shadow-emerald-400/20" : ""
                            }`}
                            role="region"
                            aria-labelledby={`doc-title-${doc.slug}`}
                          >
                            {/* Doc Header */}
                            <motion.button
                              onClick={() => toggleDoc(doc.slug)}
                              className="w-full flex items-center justify-between py-6 pr-4 group-hover/doc:bg-white/50 transition-colors"
                              aria-expanded={expandedDoc === doc.slug}
                              aria-controls={`doc-content-${doc.slug}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-gradient-to-b from-slate-500 to-slate-600 rounded-full" />
                                <div>
                                  <h3 id={`doc-title-${doc.slug}`} className="text-xl font-bold text-slate-900">
                                    {doc.title}
                                  </h3>
                                  <p className="text-xs text-slate-500 flex items-center gap-1">
                                    Last updated: <time dateTime={doc.lastUpdated}>{doc.lastUpdated}</time>
                                  </p>
                                </div>
                              </div>
                              <motion.div
                                animate={{ rotate: expandedDoc === doc.slug ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-5 h-5 text-slate-400 group-hover/doc:text-emerald-500" />
                              </motion.div>
                            </motion.button>

                            {/* Doc Content */}
                            <AnimatePresence>
                              {expandedDoc === doc.slug && (
                                <motion.div
                                  id={`doc-content-${doc.slug}`}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-6 pb-8 border-t border-slate-200/50">
                                    <LegalDocViewer content={doc.content} />
                                  </div>
                                  
                                  {/* Doc Actions */}
                                  <div className="flex gap-3 p-6 bg-slate-100/50 border-t border-slate-200/50">
                                    <Link
                                      href={`#${doc.slug}`}
                                      className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
                                    >
                                      <ScrollText className="w-3.5 h-3.5" />
                                      Back to top
                                    </Link>
                                    <button
                                      onClick={scrollToTop}
                                      className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      Print
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.section>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>

      {/* Back to Top */}
      <motion.button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:bg-emerald-700 transition-all duration-200 flex items-center justify-center z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Back to top"
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

