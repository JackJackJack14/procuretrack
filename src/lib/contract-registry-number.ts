export const CONTRACT_REGISTRY_NUMBER_LABEL =
  "เลขที่สัญญา (อ้างอิงทะเบียนคุมสัญญา)";

export const CONTRACT_REGISTRY_NUMBER_HELPER_TEXT =
  "เลขที่ที่หน่วยงานของคุณกำหนดขึ้นเพื่อคุมสัญญา (หากยังไม่มีเลข ให้ติดต่อผู้ถือทะเบียนคุมสัญญาของหน่วยงาน)";

export const CONTRACT_REGISTRY_NUMBER_DUPLICATE_ERROR_MSG =
  "❌ เลขที่สัญญานี้ถูกใช้ซ้ำกับโครงการอื่น";

export const CONTRACT_REGISTRY_NUMBER_EMPTY_ERROR_MSG =
  "กรุณาระบุเลขที่สัญญา (อ้างอิงทะเบียนคุมสัญญา)";

export type ContractRegistryNumberEntry = {
  projectId: string;
  value: string;
};

/** ทำให้รูปแบบเลขสัญญาเปรียบเทียบได้สม่ำเสมอ */
export function normalizeContractRegistryNumber(value: string): string {
  return value.trim().replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ");
}

/** แยกเลขลำดับ/ปีงบจากรูปแบบเช่น 14/2569 */
export function parseSequentialContractNumber(
  value: string,
  expectedFiscalYear?: number,
): { sequence: number; fiscalYear: number } | null {
  const trimmed = normalizeContractRegistryNumber(value);
  const match = trimmed.match(/^(\d+)\/(\d{4})$/);
  if (!match) return null;

  const sequence = Number.parseInt(match[1], 10);
  const fiscalYear = Number.parseInt(match[2], 10);
  if (!Number.isFinite(sequence) || sequence < 0 || !Number.isFinite(fiscalYear)) {
    return null;
  }
  if (expectedFiscalYear != null && fiscalYear !== expectedFiscalYear) {
    return null;
  }
  return { sequence, fiscalYear };
}

export function formatSequentialContractNumber(
  sequence: number,
  fiscalYear: number,
): string {
  return `${sequence}/${fiscalYear}`;
}

/** คำนวณเลขถัดไปในปีงบประมาณจากรายการที่มีอยู่ */
export function suggestNextContractRegistryNumber(
  values: string[],
  fiscalYear: number,
): string {
  let maxSequence = 0;
  let found = false;

  for (const raw of values) {
    const parsed = parseSequentialContractNumber(raw, fiscalYear);
    if (!parsed) continue;
    found = true;
    if (parsed.sequence > maxSequence) {
      maxSequence = parsed.sequence;
    }
  }

  const nextSequence = found ? maxSequence + 1 : 1;
  return formatSequentialContractNumber(nextSequence, fiscalYear);
}

export function isContractRegistryNumberDuplicate(
  entries: ContractRegistryNumberEntry[],
  value: string,
  excludeProjectId: string,
): boolean {
  const normalized = normalizeContractRegistryNumber(value).toLowerCase();
  if (!normalized) return false;

  return entries.some((entry) => {
    if (entry.projectId === excludeProjectId) return false;
    return normalizeContractRegistryNumber(entry.value).toLowerCase() === normalized;
  });
}
