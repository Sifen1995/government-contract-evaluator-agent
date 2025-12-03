"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { User } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/opportunities", label: "Opportunities", icon: "🎯" },
    { href: "/pipeline", label: "Pipeline", icon: "📋" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                GovAI
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.first_name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  pathname === item.href
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="ml-64 flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
