import { createHooksContext } from "..";
import { useListenForChangesDetected } from "./useChangeDetection";
import { createContext, useContext, useSetContext } from "./useContext";

describe("useContext", () => {
    test("triggers when changed", () => {
        const fooContext = createContext<number>();

        const foo = createHooksContext(() => {
            const setFoo = useSetContext(fooContext, 0);
            const foo = useContext(fooContext);
            setFoo(foo +1);
            return foo;
        })

        const [obs, ack] = useListenForChangesDetected(foo);

        let count = 0;
        obs.subscribe(() => {count ++});

        expect(foo.invoke()).toBe(0);
        ack();
        expect(foo.invoke()).toBe(1);
        ack();
        expect(foo.invoke()).toBe(2);
        ack();
        expect(count).toBe(3);
    })

    test("doesn't triggers when not changed", () => {
        const fooContext = createContext<number>();

        const foo = createHooksContext(() => {
            const setFoo = useSetContext(fooContext, 0);
            const foo = useContext(fooContext);
            setFoo(Math.min(2, foo +1));
            return foo;
        })

        const [obs, ack] = useListenForChangesDetected(foo);

        let count = 0;
        obs.subscribe(() => {count ++});

        expect(foo.invoke()).toBe(0);
        ack();
        expect(foo.invoke()).toBe(1);
        ack();
        expect(foo.invoke()).toBe(2);
        ack();
        expect(foo.invoke()).toBe(2);
        ack();
        expect(count).toBe(2);
    })

    test("doesn't trigger update if not acknowledged", () => {
        const fooContext = createContext<string>();

        const foo = createHooksContext(() => {
            const setFoo = useSetContext(fooContext, "hello world");
            const foo = useContext(fooContext);
            setFoo("banana");
            return foo;
        })

        const [obs, ack] = useListenForChangesDetected(foo);

        let count = 0;
        obs.subscribe(() => {count ++});

        expect(foo.invoke()).toBe("hello world");
        expect(foo.invoke()).toBe("banana");
        expect(foo.invoke()).toBe("banana");
        expect(count).toBe(1);
    })
});