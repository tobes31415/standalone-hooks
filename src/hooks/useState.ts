import { Callback, Generator, getHookSlot, Transformer, NotAFunction } from "..";
import { useNotifyOfChangesDetected } from "./useChangeDetection";

interface useStateMetaData<T> {
    value: T;
}

export function useState<T>(generator: Generator<NotAFunction<T>>): [T, Callback<T | Transformer<T, T>>];
export function useState<T>(initialValue: NotAFunction<T>): [T, Callback<T | Transformer<T, T>>];
export function useState<T>(initialValue: any): [T, Callback<T>] {
    const notify = useNotifyOfChangesDetected();
    const slot = getHookSlot<useStateMetaData<T>>({ init: s => s.value = typeof initialValue === "function" ? initialValue() : initialValue })
    const update = (newValue: T | Transformer<T, T>) => {
        if (typeof newValue === "function") {
            slot.value = (newValue as any)(slot.value);
        } else {
            slot.value = newValue as any;
        }
        notify();
    }
    return [slot.value, update];
}