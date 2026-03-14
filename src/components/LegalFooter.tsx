"use client";

import Link from "next/link";

const links = [
  { href: "/legal", label: "Legal Center" },
  { href: "/legal#privacy", label: "Privacy" },
  { href: "/legal#community", label: "Community" },
  { href: "/legal#copyright", label: "Copyright" },
  { href: "/contact", label: "Contact" },
];

export default function LegalFooter({ className = "" }: { className?: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-slate-900 text-slate-300 ${className}`.trim()}>
      <div className="container mx-auto px-4 py-3">
        <div className="text-center text-xs">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <p className="text-[11px] text-slate-500 ml-2">
              © {currentYear} Spotly. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
