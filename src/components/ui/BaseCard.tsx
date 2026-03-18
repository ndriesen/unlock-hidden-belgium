"use client";

import Link from "next/link";
import Image from "next/image";

interface BaseCardProps {
  title: string;
  imageUrl?: string | null;
  href: string;
  priority?: boolean;
  children?: React.ReactNode;
}

export default function BaseCard({
  title,
  imageUrl,
  href,
  priority = false,
  children,
}: BaseCardProps) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
      {/* Image */}
      <Link href={href} className="block relative h-32">
        <Image
          src={imageUrl || "/fallback.jpg"}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={priority}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Title overlay */}
        <div className="absolute bottom-2 left-2 right-2 text-white text-sm font-semibold line-clamp-2">
          {title}
        </div>
      </Link>

      {/* Content */}
      {children && <div className="p-3">{children}</div>}
    </article>
  );
}