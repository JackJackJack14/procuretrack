import { supabase } from "@/integrations/supabase/client";
import { loadStep7FormFromNote } from "@/lib/step-form";
import {
  type ContractRegistryNumberEntry,
  normalizeContractRegistryNumber,
} from "@/lib/contract-registry-number";

function pushEntry(
  entries: ContractRegistryNumberEntry[],
  seen: Set<string>,
  projectId: string,
  raw: string | null | undefined,
) {
  const value = raw?.trim();
  if (!value) return;
  const key = `${projectId}::${normalizeContractRegistryNumber(value).toLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  entries.push({ projectId, value });
}

/** รวบรวมเลขที่สัญญาทั้งหมดในหน่วยงานและปีงบประมาณเดียวกัน */
export async function fetchOrganizationContractRegistryNumbers(opts: {
  organizationId: string;
  fiscalYear: number;
}): Promise<ContractRegistryNumberEntry[]> {
  const { organizationId, fiscalYear } = opts;
  const entries: ContractRegistryNumberEntry[] = [];
  const seen = new Set<string>();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, contract_no")
    .eq("organization_id", organizationId)
    .eq("fiscal_year", fiscalYear);

  if (projectsError) throw projectsError;

  for (const project of projects ?? []) {
    pushEntry(entries, seen, project.id, project.contract_no);
  }

  const { data: contracts, error: contractsError } = await supabase
    .from("contracts")
    .select("contract_number, project_id, projects!inner(fiscal_year)")
    .eq("organization_id", organizationId);

  if (contractsError) throw contractsError;

  for (const contract of contracts ?? []) {
    const project = contract.projects as { fiscal_year?: number } | null;
    if (project?.fiscal_year !== fiscalYear) continue;
    pushEntry(entries, seen, contract.project_id, contract.contract_number);
  }

  const { data: step7Rows, error: step7Error } = await supabase
    .from("procurement_steps")
    .select("note, project_id, projects!inner(organization_id, fiscal_year)")
    .eq("step_number", 7);

  if (step7Error) throw step7Error;

  for (const row of step7Rows ?? []) {
    const project = row.projects as { organization_id?: string; fiscal_year?: number } | null;
    if (project?.organization_id !== organizationId || project?.fiscal_year !== fiscalYear) {
      continue;
    }
    const form = loadStep7FormFromNote(row.note);
    pushEntry(entries, seen, row.project_id, form.contractNotice?.agreed_contract_no);
  }

  return entries;
}
