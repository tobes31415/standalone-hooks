import { AnyFunction, getHookSlot } from "..";
import { useNotifyOfChangesDetected } from "./useChangeDetection";

interface UseMemoData<T> {
    previousDeps: any[];
    previousValue: T;
}

export function useMemo<Fn extends AnyFunction>(fn: Fn, deps: any[]): ReturnType<Fn> {
    const notify = useNotifyOfChangesDetected();
    const slot = getHookSlot<UseMemoData<ReturnType<Fn>>>({});
    if (!slot.previousDeps || (deps && slot.previousDeps.some((previousValue, index) => deps[index] !== previousValue))) {
        slot.previousDeps = deps || [];
        slot.previousValue = fn();
        notify();
    }
    return slot.previousValue();
}