import { AnyFunction } from "..";
import { useMemo } from "./useMemo";

export function useCallback(fn: AnyFunction, deps: []) {
    return useMemo(() => fn, deps);
} 