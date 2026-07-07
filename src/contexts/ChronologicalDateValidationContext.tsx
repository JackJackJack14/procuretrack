import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { ChronologicalFieldKey } from "@/lib/chronological-date-chains";
import {
  getChronologicalDateIssues,
  getChronologicalFieldError,
  resolveChronologicalFieldMinDate,
  type ChronologicalFormSnapshot,
} from "@/lib/chronological-date-validator";
import type { TimelineValidationContext } from "@/lib/timeline-validation";

type ChronologicalDateValidationContextValue = {
  snapshot: ChronologicalFormSnapshot;
  timelineCtx: TimelineValidationContext;
  activeStepNumber: number;
  getFieldMinDate: (
    fieldKey: ChronologicalFieldKey,
    opts?: {
      explicitMinDate?: string | null;
      additionalMinDates?: Array<string | null | undefined>;
    },
  ) => string | undefined;
  getFieldError: (fieldKey: ChronologicalFieldKey) => string | null;
  getStepIssues: (stepNumber?: number) => ReturnType<typeof getChronologicalDateIssues>;
};

const ChronologicalDateValidationContext =
  createContext<ChronologicalDateValidationContextValue | null>(null);

export function ChronologicalDateValidationProvider({
  snapshot,
  timelineCtx,
  activeStepNumber,
  children,
}: {
  snapshot: ChronologicalFormSnapshot;
  timelineCtx: TimelineValidationContext;
  activeStepNumber: number;
  children: ReactNode;
}) {
  const value = useMemo<ChronologicalDateValidationContextValue>(
    () => ({
      snapshot,
      timelineCtx,
      activeStepNumber,
      getFieldMinDate: (fieldKey, opts) =>
        resolveChronologicalFieldMinDate(fieldKey, snapshot, timelineCtx, opts),
      getFieldError: (fieldKey) =>
        getChronologicalFieldError(fieldKey, activeStepNumber, snapshot, timelineCtx),
      getStepIssues: (stepNumber = activeStepNumber) =>
        getChronologicalDateIssues(stepNumber, snapshot, timelineCtx),
    }),
    [snapshot, timelineCtx, activeStepNumber],
  );

  return (
    <ChronologicalDateValidationContext.Provider value={value}>
      {children}
    </ChronologicalDateValidationContext.Provider>
  );
}

export function useChronologicalDateValidation(): ChronologicalDateValidationContextValue | null {
  return useContext(ChronologicalDateValidationContext);
}

/** แสดง error สีแดงใต้ Date Picker — จาก Global Validator */
export function ChronologicalDateFieldError({
  fieldKey,
  show,
}: {
  fieldKey: ChronologicalFieldKey;
  show?: boolean;
}) {
  const ctx = useChronologicalDateValidation();
  if (!ctx) return null;
  const message = ctx.getFieldError(fieldKey);
  if (!show && !message) return null;
  if (!message) return null;
  return (
    <p className="text-xs text-destructive font-semibold mt-1" role="alert">
      {message}
    </p>
  );
}
