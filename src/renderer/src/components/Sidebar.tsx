import {
  Compass,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewId = "dashboard" | "roadmap" | "focus" | "admin";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  focusBadge?: string | null;
  focusLabel?: string | null;
}

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "roadmap", label: "Roadmap", icon: Route },
  { id: "focus", label: "Focus Timer", icon: Timer },
  { id: "admin", label: "Admin", icon: ShieldCheck },
];

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  activeView,
  onNavigate,
  focusBadge,
  focusLabel,
}: SidebarProps): JSX.Element {
  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 ease-in-out",
        collapsed ? "w-14" : "w-56"
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2 border-b border-border px-4",
          collapsed && "justify-center px-0"
        )}
      >
        <Compass className="size-5 shrink-0 text-primary" />
        {!collapsed && <span className="text-sm font-semibold tracking-tight">Northstar</span>}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          const badge = id === "focus" ? focusBadge : null;
          const label2 = id === "focus" ? focusLabel : null;
          return (
            <button
              key={id}
              type="button"
              title={[label, badge, label2].filter(Boolean).join(" — ")}
              onClick={() => onNavigate(id)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className="relative">
                <Icon className="size-4 shrink-0" />
                {badge && (
                  <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-warning" />
                )}
              </span>
              {!collapsed && (
                <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>{label}</span>
                    {badge && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                          isActive ? "bg-primary-foreground/20" : "bg-warning/15 text-warning"
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </span>
                  {label2 && (
                    <span
                      className={cn(
                        "w-full truncate text-left text-[11px] opacity-80",
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {label2}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="size-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
