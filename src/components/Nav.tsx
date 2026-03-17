"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "RIDES" },
  { href: "/commute/new", label: "LOG" },
  { href: "/commute", label: "STATS" },
  { href: "/map", label: "CRASH" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-mta-yellow text-xl font-bold tracking-tighter">CRANKY COMMUTER</span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Subway line style nav */}
          <div className="flex items-center">
            {links.map((link, i) => {
              const isActive = pathname === link.href;
              return (
                <div key={link.href} className="flex items-center">
                  {i > 0 && (
                    <div className="w-8 h-0.5 bg-mta-yellow" />
                  )}
                  <Link
                    href={link.href}
                    className={`
                      relative flex items-center justify-center
                      w-10 h-10 rounded-full border-2 border-mta-yellow
                      text-[10px] font-bold tracking-wider
                      transition-all duration-200
                      ${isActive
                        ? "bg-mta-yellow text-background"
                        : "bg-background text-mta-yellow hover:bg-mta-yellow/20"
                      }
                    `}
                  >
                    {link.label.charAt(0)}
                    <span className="absolute -bottom-5 text-[9px] text-muted whitespace-nowrap">
                      {link.label}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
