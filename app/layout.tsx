import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/shared/app-shell";
import { AuthProvider } from "@/lib/auth/auth-context";

export const metadata: Metadata = {
  title: "MEDORA — Connected Healthcare Platform",
  description: "A connected, transparent, and auditable digital healthcare ecosystem connecting Patients, Doctors, Hospitals, Labs, Pharmacies, Emergency, and Financial Assistance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-background font-sans antialiased text-foreground">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
