import { getLegalDocuments, LegalDoc } from "@/lib/legal";
import LegalCenter from "@/components/legal/LegalCenter";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Legal Center - Unlock Hidden Belgium",
  description: "Terms of service, privacy policy, cookie policy, and all legal documents for Unlock Hidden Belgium platform.",
};

interface LegalPageProps {
  documents: LegalDoc[];
}

export default async function LegalPage() {
  const documents = await getLegalDocuments();

  if (documents.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-8 bg-slate-100 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">📜</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Legal Documents</h1>
          <p className="text-slate-600 mb-8">Legal documents will appear here when files are available in the /legal directory.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-lg text-slate-600 animate-pulse">Loading legal documents...</div>
      </div>
    }>
      <LegalCenter documents={documents} />
    </Suspense>
  );
}

