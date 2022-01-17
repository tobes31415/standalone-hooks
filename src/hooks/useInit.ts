import { Action, Generator } from "..";
import { useEffect } from "./useEffect";

export function useInit(fn: Action | Generator<Action> ) {
    return useEffect(fn, []);
}