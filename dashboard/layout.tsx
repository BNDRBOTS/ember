"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Calendar", href: "/dashboard/calendar" },
  { label: "Brand", href: "/dashboard/brand" },
  { label: "Analytics", href: "/dashboard/analytics" },
  { label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div style={{ display: "flex" }}>
      <aside style={{ width: 220, background: "#f0f0f0", padding: 20 }}>
        <h2>Ember</h2>
        <nav>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                style={{
                  padding: "8px 0",
                  fontWeight: pathname === item.href ? "bold" : "normal",
                }}
              >
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 20 }}>{children}</main>
    </div>
  );
}
