import { Action, Generator, getHookSlot } from "..";
import { useMemo } from "./useMemo";

interface UseEffectMetaData {
    cleanupFn?: Action;
}

export function useEffect(fn: Action | Generator<Action>, deps: any[]) {
    const slot = getHookSlot<UseEffectMetaData>({ init: s => {
        if (s.cleanupFn) {
            s.cleanupFn();
        }
    }})
    useMemo(() => {
        if (slot.cleanupFn) {
            slot.cleanupFn();
        }
        slot.cleanupFn = fn() || undefined;
    }, deps);
}