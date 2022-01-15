import { createHooksContext } from ".";

describe("context", () => {
    test("creates without errors", () => {
        const foo = createHooksContext(() => 123);
    });
})