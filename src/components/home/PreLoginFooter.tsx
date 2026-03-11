"use client";

import Link from "next/link";
import { Map, Github, Twitter } from "lucide-react";

export default function PreLoginFooter() {
  const currentYear = new Date().getFullYear();

  const links = [
    { href: "/about", label: "About" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 py-10 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Map className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Spotly</p>
                <p className="text-slate-500 text-xs">Unlock hidden gems</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              Discover the best-kept secrets of Belgium. Join thousands of explorers finding hidden gems every day.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Follow us for the latest updates and hidden gem discoveries.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {currentYear} Spotly. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">
            Made with ❤️ for explorers everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}

