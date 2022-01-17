import { findLast } from "./util"

describe("util", () => {
    describe("findLast", () => {
        test("enumerates all elements", () => {
            const list = ["a", "b", "c"];
            expect(findLast(list, (v) => v === "a")).toBe("a");
            expect(findLast(list, (v) => v === "b")).toBe("b");
            expect(findLast(list, (v) => v === "c")).toBe("c");
            expect(findLast(list, (v) => v === "d")).toBe(undefined);
        })

        test("returns the last match", () => {
            const list = [{ a: 1, b: 2 }, { a: 1, b: 3 }, { a: 1, b: 4 }];
            expect(findLast(list, (v) => v.a === 1)?.b).toBe(4);
        })
    })
})