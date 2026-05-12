import { PublicHeader, PublicFooter } from "@/components/layout/public-layout";

export default function AcademieLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f7f3eb" }}>
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
