import type { Metadata } from "next";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRANKY COMMUTER",
  description: "Daily bike commute tracker. Score the vibes. File your grievances. Log crashes when they happen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Nav />
        <main className="pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
