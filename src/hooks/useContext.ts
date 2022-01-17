import { Subject } from "@tobes31415/basic-observables";
import { Callback, getHookSlot, Generator, findParentHookSlot, NotAFunction } from "..";
import { useNotifyOfChangesDetected } from "./useChangeDetection";

interface ContextMetaData<T> {
    parentValue: T;
    overrideValue: T | undefined;
    onUpdate: Subject<T>;
}

const NAME_ACCESS_SYMBOL = Symbol("Context Name");

type ContextTypes<T> = NotAFunction<NonNullable<T>>;

export interface ContextKey<T> {
    readonly label: string | undefined;
}

export function createContext<T = any>(label?: string): ContextKey<ContextTypes<T>> {
    const name = Symbol(label);
    const key = {
        label, [NAME_ACCESS_SYMBOL]: name
    };
    try {
        Object.freeze(key);
    }
    catch (ignored) { }
    return key;
}

export function useContext<T>(key: ContextKey<T>): T {
    const slot = getContextSlot(key);
    if (slot.parentValue === undefined && slot.overrideValue === undefined) {
        throw new Error("Context has no value, make sure to call useSetContext before calling useContext");
    }
    return slot.overrideValue === undefined ? slot.parentValue : slot.overrideValue;
}

export function useSetContext<T>(key: ContextKey<T>, init?: ContextTypes<T> | Generator<ContextTypes<T>>): Callback<ContextTypes<T>> {
    const notify = useNotifyOfChangesDetected();
    const slot = getContextSlot(key, init);
    return (newValue: T) => {
        if (newValue !== slot.overrideValue) {
            slot.overrideValue = newValue;
            slot.onUpdate.next(newValue);
            notify();
        }
    }
}

function getContextSlot<T>(key: ContextKey<T>, init?: ContextTypes<T> | Generator<ContextTypes<T>>): ContextMetaData<T> {
    const notify = useNotifyOfChangesDetected();
    const name = (key as any)[NAME_ACCESS_SYMBOL];
    return getHookSlot({
        name, init: (slot) => {
            slot.onUpdate = new Subject<T>();
            if (init !== undefined) {
                if (typeof init === "function") {
                    slot.overrideValue = (init as any)();
                } else {
                    slot.overrideValue = init;
                }
            } else {
                const parent = findParentHookSlot<ContextMetaData<T>>(name);
                if (parent) {
                    const subscription = parent.onUpdate.subscribe(newValue => {
                        slot.parentValue = newValue;
                        if (!slot.overrideValue) {
                            slot.onUpdate.next(newValue);
                            notify();
                        }
                    })
                    return () => subscription.unsubscribe();
                }
            }
        }
    })
}