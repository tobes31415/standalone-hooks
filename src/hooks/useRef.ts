import { Generator, getHookSlot } from "..";

interface RefT<T> {
    current: T;
}

export function useRef<T>(initialValue: T): RefT<T>;
export function useRef<T>(initialValue: Generator<T>): RefT<T>;
export function useRef<T>(initialValue: any): RefT<T> {
    return getHookSlot<RefT<T>>({ init: s => { 
        s.current = typeof initialValue === "function" ? initialValue() : initialValue 
        try {
            Object.seal(s);
        }
        catch(ignored) {}
    } })
}