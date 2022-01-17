import { Callback, Generator, getHookSlot } from "..";

interface useConstantMetaData<T> {
    value: T;
}

export function useState<T>(generator: Generator<T>): T;
export function useState<T>(initialValue: T): T;
export function useState<T>(initialValue: any): T {
    const slot = getHookSlot<useConstantMetaData<T>>({ init: s => s.value = typeof initialValue === "function" ? initialValue() : initialValue })
    return slot.value;
}