import { createHooksContext, getHookSlot } from "./context";

describe("context", () => {
    test("creates without errors", () => {
        const foo = createHooksContext(() => 123);
    });

    test("Invokes without error", () => {
        const foo = createHooksContext(() => 123);
        expect(foo.invoke()).toBe(123);
    })

    test("Invokes twice without error", () => {
        const foo = createHooksContext(() => 123);
        expect(foo.invoke()).toBe(123);
        expect(foo.invoke()).toBe(123);
    });

    test("Fails on reentry", () => {
        let foo: any;
        foo = createHooksContext(() => foo.invoke());

        expect(() => foo.invoke()).toThrow();

    })

    test("Gets a named slot using a string", () => {
        const foo = createHooksContext(() => {
            const slotA = getHookSlot({ name: "test" });
            slotA.test = 123;
            const slotB = getHookSlot({ name: "test" });
            expect(slotA.test).toBe(slotB.test);

        });

        foo.invoke();
    })

    test("Gets a named slot using a number", () => {
        const foo = createHooksContext(() => {
            const slotA = getHookSlot({ name: 1 });
            slotA.test = 123;
            const slotB = getHookSlot({ name: 1 });
            expect(slotA.test).toBe(slotB.test);

        });

        foo.invoke();
    })

    test("Gets a named slot using a symbol", () => {
        const sym = Symbol("test");
        const foo = createHooksContext(() => {
            const slotA = getHookSlot({ name: sym });
            slotA.test = 123;
            const slotB = getHookSlot({ name: sym });
            expect(slotA.test).toBe(slotB.test);
        });

        foo.invoke();
    });

    test("Named slots do not overlap", () => {
        const foo = createHooksContext(() => {
            const slotA = getHookSlot({ name: "testA" });
            slotA.test = 123;
            const slotB = getHookSlot({ name: "testB" });
            expect(slotA.test).not.toBe(slotB.test);
        });
        foo.invoke();
    })

    test("Named slots are consistent across invocations", () => {
        const foo = createHooksContext(() => {
            const slotA = getHookSlot({ name: "test", init: (s) => s.test = 1 });
            slotA.test += 1;
            return slotA.test;
        });
        const a = foo.invoke();
        const b = foo.invoke();
        expect(a).toBe(2);
        expect(b).toBe(3);
    })

    test("Indexed slots are consistent across invocations", () => {
        const foo = createHooksContext(() => {
            const slotA = getHookSlot({ init: (s) => s.test = 1 });
            slotA.test += 1;
            return slotA.test;
        });
        const a = foo.invoke();
        const b = foo.invoke();
        expect(a).toBe(2);
        expect(b).toBe(3);
    })

    test("Multiple Indexed slots are unique", () => {
        const foo = createHooksContext(() => {
            const slotA = getHookSlot({ init: (s) => s.test = 1 });
            slotA.test += 1;
            const slotB = getHookSlot({ init: (s) => s.test = 10 });
            slotB.test += 1;
            return [slotA.test, slotB.test];
        });
        const a = foo.invoke();
        const b = foo.invoke();
        expect(a).toEqual([2, 11]);
        expect(b).toEqual([3, 12]);
    })

    test("Dispose logic is executed", () => {
        let didRun = false;
        const foo = createHooksContext(() => {
            const slotA = getHookSlot({ init: (s) => { return () => didRun = true } });
        });
        foo.invoke();
        expect(didRun).toBe(false);
        foo.dispose();
        expect(didRun).toBe(true);
    })

    test("Update logic is executed", () => {
        let didRun = false;
        const foo = createHooksContext(() => {
            const slotA = getHookSlot({
                init: (s) => s.test = 1, update: (s) => {
                    s.test++
                    didRun = true;
                }
            });
            return slotA.test;
        });
        expect(didRun).toBe(false);
        const a = foo.invoke();
        const b = foo.invoke();
        expect(a).toBe(2);
        expect(b).toBe(3);
        expect(didRun).toBe(true);
    })
})