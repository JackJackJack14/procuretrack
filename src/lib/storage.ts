import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const STORAGE_LIMITS: Record<string, number> = {
  trial: 524288000, // 500 MB
  starter: 5368709120, // 5 GB
  pro: 10737418240, // 10 GB
};

export function getStorageLimit(plan: string | null | undefined): number {
  if (!plan) return STORAGE_LIMITS.trial;
  return STORAGE_LIMITS[plan] ?? STORAGE_LIMITS.trial;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  const formatted = i === 0 ? value.toFixed(0) : value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2);
  return `${formatted} ${units[i]}`;
}

export function getStoragePercent(used: number, plan: string | null | undefined): number {
  const limit = getStorageLimit(plan);
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Returns { ok: true } if upload can proceed; otherwise shows toast and returns { ok: false }.
 */
export async function checkStorageQuota(
  organizationId: string,
  fileSize: number,
): Promise<{ ok: boolean; used: number; limit: number; plan: string }> {
  const { data: org } = await supabase
    .from("organizations")
    .select("plan, storage_used_bytes")
    .eq("id", organizationId)
    .maybeSingle();

  const plan = org?.plan ?? "trial";
  const used = Number(org?.storage_used_bytes ?? 0);
  const limit = getStorageLimit(plan);

  if (used + fileSize > limit) {
    toast.error(
      `พื้นที่จัดเก็บเต็มแล้ว (${formatBytes(used)} / ${formatBytes(limit)}) กรุณาอัปเกรดแพ็กเกจเพื่อพื้นที่เพิ่มเติม`,
      {
        action: {
          label: "อัปเกรดแพ็กเกจ",
          onClick: () => {
            window.location.href = "/settings/subscription";
          },
        },
      },
    );
    return { ok: false, used, limit, plan };
  }
  return { ok: true, used, limit, plan };
}

export async function incrementStorageUsage(_organizationId: string, bytes: number): Promise<void> {
  if (!bytes) return;
  await supabase.rpc("adjust_storage_usage", { delta: bytes });
}

export async function decrementStorageUsage(_organizationId: string, bytes: number): Promise<void> {
  if (!bytes) return;
  await supabase.rpc("adjust_storage_usage", { delta: -bytes });
}
