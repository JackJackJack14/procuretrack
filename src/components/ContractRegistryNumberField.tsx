import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FieldLabelTooltip } from "@/components/FieldLabelTooltip";
import { getFieldTooltip, type FieldTooltipKey } from "@/constants/tooltips";
import { fetchOrganizationContractRegistryNumbers } from "@/lib/contract-registry-number-api";
import {
  CONTRACT_REGISTRY_NUMBER_DUPLICATE_ERROR_MSG,
  CONTRACT_REGISTRY_NUMBER_HELPER_TEXT,
  CONTRACT_REGISTRY_NUMBER_LABEL,
  isContractRegistryNumberDuplicate,
  suggestNextContractRegistryNumber,
} from "@/lib/contract-registry-number";

const INPUT_CLS =
  "w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function highlightInputCls(base: string, highlighted: boolean): string {
  return highlighted
    ? `${base} border-red-500 bg-red-50 focus:ring-red-500`
    : base;
}

export type ContractRegistryNumberFieldProps = {
  value: string;
  onChange: (value: string) => void;
  organizationId: string;
  fiscalYear: number;
  projectId: string;
  readOnly?: boolean;
  required?: boolean;
  complianceTarget?: string;
  complianceHighlighted?: boolean;
  placeholder?: string;
  tooltipKey?: FieldTooltipKey;
  onDuplicateChange?: (isDuplicate: boolean) => void;
  inputClassName?: string;
};

export function ContractRegistryNumberField({
  value,
  onChange,
  organizationId,
  fiscalYear,
  projectId,
  readOnly = false,
  required = true,
  complianceTarget,
  complianceHighlighted = false,
  placeholder = "เช่น 15/2569",
  tooltipKey = "contract.registry_no",
  onDuplicateChange,
  inputClassName = INPUT_CLS,
}: ContractRegistryNumberFieldProps) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const tooltipText = getFieldTooltip(tooltipKey);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), 300);
    return () => window.clearTimeout(timer);
  }, [value]);

  const { data: registryEntries = [], isLoading } = useQuery({
    queryKey: ["contract-registry-numbers", organizationId, fiscalYear],
    queryFn: () =>
      fetchOrganizationContractRegistryNumbers({
        organizationId,
        fiscalYear,
      }),
    enabled: Boolean(organizationId && fiscalYear),
    staleTime: 30_000,
  });

  const suggestedNext = useMemo(
    () =>
      suggestNextContractRegistryNumber(
        registryEntries.map((entry) => entry.value),
        fiscalYear,
      ),
    [registryEntries, fiscalYear],
  );

  const isDuplicate = useMemo(() => {
    if (!debouncedValue.trim()) return false;
    return isContractRegistryNumberDuplicate(
      registryEntries,
      debouncedValue,
      projectId,
    );
  }, [debouncedValue, registryEntries, projectId]);

  useEffect(() => {
    onDuplicateChange?.(isDuplicate);
  }, [isDuplicate, onDuplicateChange]);

  const showDuplicateError = isDuplicate && debouncedValue.trim().length > 0;
  const inputHighlighted = complianceHighlighted || showDuplicateError;

  return (
    <div data-compliance-target={complianceTarget}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-sm font-medium">
          {CONTRACT_REGISTRY_NUMBER_LABEL}
          {required && <span className="text-destructive"> *</span>}
        </label>
        <FieldLabelTooltip text={tooltipText} />
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={`${highlightInputCls(inputClassName, inputHighlighted)} min-w-[12rem] flex-1`}
          placeholder={placeholder}
          aria-invalid={showDuplicateError}
        />
        {!readOnly && (
          <button
            type="button"
            onClick={() => onChange(suggestedNext)}
            disabled={isLoading}
            className="shrink-0 text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80 disabled:opacity-50 disabled:no-underline whitespace-nowrap pt-2.5"
            title={isLoading ? "กำลังโหลดเลขที่สัญญาล่าสุด..." : `แนะนำ ${suggestedNext}`}
          >
            ✨ แนะนำเลขที่สัญญาถัดไป
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
        {CONTRACT_REGISTRY_NUMBER_HELPER_TEXT}
      </p>

      {showDuplicateError && (
        <p className="text-xs text-red-600 font-medium mt-1" role="alert">
          {CONTRACT_REGISTRY_NUMBER_DUPLICATE_ERROR_MSG}
        </p>
      )}
    </div>
  );
}
