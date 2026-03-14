'use client'

import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

type CodeProps = ComponentProps<"code"> & { inline?: boolean };

interface LegalDocViewerProps {
  content: string;
  className?: string;
}

export default function LegalDocViewer({ content, className = "" }: LegalDocViewerProps) {
  const handleCopy = (e: React.ClipboardEvent) => e.preventDefault();
  const handleContext = (e: React.MouseEvent) => e.preventDefault();
  const handleSelect = (e: React.MouseEvent) => e.stopPropagation();

  const codeComponent = ({ inline, className, children, ...props }: CodeProps) => {
    const match = /language-(\w+)/.exec(className || "");
    return !inline && match ? (
      <div className="my-6 p-4 bg-slate-900 rounded-2xl overflow-x-auto no-print">
        <pre className="text-sm font-mono text-slate-200">
          <code className="language-javascript" {...props}>
            {children}
          </code>
        </pre>
      </div>
    ) : (
      <code className="bg-slate-100/80 px-1.5 py-px rounded font-mono text-sm border border-slate-200" {...props}>
        {children}
      </code>
    );
  };

  return (
    <div
      className={`prose prose-slate max-w-none max-h-[70vh] overflow-y-auto scrollbar-thin prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-emerald-600 hover:prose-a:underline prose-ul:ml-6 prose-ol:ml-6 prose-code:before:content-none prose-code:after:content-none ${className}`}
      onCopy={handleCopy}
      onContextMenu={handleContext}
      onMouseDown={handleSelect}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [
            rehypeSanitize,
            {
              attributes: {
                a: ["href", "title", "target", "rel"],
              },
            },
          ],
        ]}
        components={{
          h1: "h1",
          h2: "h2",
          h3: "h3",
          code: codeComponent,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

