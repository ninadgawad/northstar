import { Compass, LayoutDashboard, PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewId = "dashboard" | "admin";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
}

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "admin", label: "Admin", icon: ShieldCheck },
];

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  activeView,
  onNavigate,
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
          return (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => onNavigate(id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
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
