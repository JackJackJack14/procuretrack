import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, AlertCircle, Clock, Info, CheckCircle2 } from "lucide-react";
import { fetchAlerts, type Alert } from "@/lib/alerts";
import { formatThaiDate } from "@/lib/utils";
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";

export function Notifications() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: 60_000,
  });

  const redCount = alerts.filter((a) => a.level === "red").length;
  const totalCount = alerts.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative h-9 w-9 rounded-md hover:bg-accent flex items-center justify-center">
          <Bell className="h-4 w-4" />
          {redCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
              {redCount > 9 ? "9+" : redCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[400px] p-0">
        <div className="px-4 py-3 border-b">
          <p className="font-semibold text-sm">การแจ้งเตือน</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalCount > 0
              ? `${totalCount} รายการ (ด่วน ${redCount} รายการ)`
              : "ทุกโครงการดำเนินการปกติ"}
          </p>
        </div>
        <div className="max-h-[480px] overflow-y-auto divide-y">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-success" />
              ทุกโครงการดำเนินการปกติ ✓
            </div>
          ) : (
            alerts.map((a) => (
              <NotificationItem
                key={a.id}
                alert={a}
                onGo={(id) => {
                  setOpen(false);
                  navigate({ to: "/projects/$projectId", params: { projectId: id } });
                }}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({ alert, onGo }: { alert: Alert; onGo: (id: string) => void }) {
  const cfg = {
    red: { Icon: AlertCircle, bg: "bg-destructive/10", color: "text-destructive" },
    yellow: { Icon: Clock, bg: "bg-yellow-500/10", color: "text-yellow-600" },
    blue: { Icon: Info, bg: "bg-blue-500/10", color: "text-blue-600" },
  }[alert.level];
  const { Icon } = cfg;

  return (
    <div className="p-3 hover:bg-accent/50 flex gap-3">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{alert.projectName}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.detail}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">{formatThaiDate(alert.date)}</span>
          <button
            onClick={() => onGo(alert.projectId)}
            className="text-xs text-primary font-medium hover:underline"
          >
            ดูโครงการ →
          </button>
        </div>
      </div>
    </div>
  );
}
