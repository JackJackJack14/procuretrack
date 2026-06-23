import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home, FolderKanban, ClipboardList, HardHat, FileArchive,
  BarChart3, LayoutDashboard, Settings, CreditCard, LogOut, Building2, Menu, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Notifications } from "@/components/Notifications";

const MAIN_NAV = [
  { to: "/dashboard", label: "หน้าหลัก", icon: Home },
  { to: "/executive", label: "ภาพรวมผู้บริหาร", icon: LayoutDashboard },
  { to: "/projects", label: "โครงการทั้งหมด", icon: FolderKanban },
  { to: "/procurement", label: "จัดซื้อจัดจ้าง", icon: ClipboardList },
  { to: "/construction", label: "ติดตามงานก่อสร้าง", icon: HardHat },
  { to: "/documents", label: "คลังเอกสาร", icon: FileArchive },
  { to: "/reports", label: "รายงาน", icon: BarChart3 },
];

const BOTTOM_NAV = [
  { to: "/settings", label: "ตั้งค่า", icon: Settings },
  { to: "/settings/subscription", label: "แพ็กเกจของฉัน", icon: CreditCard },
];

export function AppShell({ children, breadcrumb }: { children: React.ReactNode; breadcrumb?: string }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [userName, setUserName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u, error: authErr } = await supabase.auth.getUser();
      if (authErr || !u.user) {
        if (authErr) await supabase.auth.signOut();
        navigate({ to: "/login" });
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, organizations(name)")
        .eq("id", u.user.id)
        .maybeSingle();
      if (prof) {
        setUserName(prof.full_name ?? "");
        const org = (prof as any).organizations;
        setOrgName(org?.name ?? "");
      }
    })();
  }, [navigate]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const sidebar = (
    <>
      <div className="px-5 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-base">ProcureTrack</span>
        </div>
        {orgName && (
          <p className="text-xs text-muted-foreground mt-2 truncate" title={orgName}>{orgName}</p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {MAIN_NAV.map((item) => <NavItem key={item.to} item={item} active={pathname === item.to} />)}
        <div className="my-3 border-t border-sidebar-border" />
        {BOTTOM_NAV.map((item) => <NavItem key={item.to} item={item} active={pathname === item.to} />)}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition"
        >
          <LogOut className="h-4 w-4" />
          <span>ออกจากระบบ</span>
        </button>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-[220px] bg-sidebar border-r border-sidebar-border flex-col hidden md:flex">
        {sidebar}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-[260px] bg-sidebar border-r border-sidebar-border flex flex-col z-50 md:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </>
      )}

      {/* Topbar */}
      <header className="fixed top-0 left-0 md:left-[220px] right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 z-30">
        <div className="flex items-center gap-3 text-sm min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden h-9 w-9 rounded-md hover:bg-accent flex items-center justify-center shrink-0"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-muted-foreground truncate">{breadcrumb ?? "หน้าหลัก"}</span>
          <span className="text-muted-foreground/40 hidden md:inline">·</span>
          <span className="text-muted-foreground hidden lg:inline">ProcureTrack - ผู้ช่วยงานจัดซื้อจัดจ้างภาครัฐ</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <Notifications />
          <div className="text-sm font-medium hidden sm:block">{userName || "ผู้ใช้"}</div>
        </div>
      </header>

      <main className="md:ml-[220px] pt-14">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ item, active }: { item: { to: string; label: string; icon: any }; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}
