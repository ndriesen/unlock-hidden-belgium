import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import SidebarLayout from "@/components/SidebarLayout";
import { SearchProvider } from "@/context/SearchContext";
import { AuthModalProvider } from "@/lib/hooks/useAuthModal";
import AuthModal from "@/components/auth/AuthModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spotly",
  description: "Unlock hidden gems",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-gray-900`}
      >
        <AuthProvider>
          <SearchProvider>
            <AuthProvider>
              <SidebarLayout>{children}</SidebarLayout>
              <AuthModal />
            </AuthProvider>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

