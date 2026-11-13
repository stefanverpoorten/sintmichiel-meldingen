"use client";
import { createContext, useCallback, useContext, useState } from "react";

type T = { tekst: string; fout?: boolean } | null;
const Ctx = createContext<(tekst: string, fout?: boolean) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<T>(null);
  const toon = useCallback((tekst: string, fout?: boolean) => {
    setToast({ tekst, fout });
    setTimeout(() => setToast(null), fout ? 8000 : 3000);
  }, []);
  return (
    <Ctx.Provider value={toon}>
      {children}
      {toast && (
        <div className={`toast ${toast.fout ? "fout" : ""}`} role="status" onClick={() => setToast(null)}>
          {toast.tekst}
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
