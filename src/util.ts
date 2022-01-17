import { Transformer } from "./types";

export function findLast<T>(list: T[], predicate: Transformer<T, boolean>, skip: number = 0): T | undefined {
    for (var i = list.length - (1 + skip); i >= 0; i--) {
        const item = list[i];
        if (predicate(item)) {
            return item;
        }
    }
}