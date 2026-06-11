import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "procuretrack_guide_mode";

type GuideModeContextValue = {
  guideMode: boolean;
  setGuideMode: (value: boolean) => void;
  toggleGuideMode: () => void;
};

const GuideModeContext = createContext<GuideModeContextValue | null>(null);

function readGuideMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function GuideModeProvider({ children }: { children: ReactNode }) {
  const [guideMode, setGuideModeState] = useState(readGuideMode);

  const setGuideMode = useCallback((value: boolean) => {
    setGuideModeState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const toggleGuideMode = useCallback(() => {
    setGuideModeState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ guideMode, setGuideMode, toggleGuideMode }),
    [guideMode, setGuideMode, toggleGuideMode],
  );

  return (
    <GuideModeContext.Provider value={value}>{children}</GuideModeContext.Provider>
  );
}

export function useGuideMode(): GuideModeContextValue {
  const ctx = useContext(GuideModeContext);
  if (!ctx) {
    return {
      guideMode: false,
      setGuideMode: () => {},
      toggleGuideMode: () => {},
    };
  }
  return ctx;
}
