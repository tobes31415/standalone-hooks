import { createHooksContext } from "./context";

export * from "./types";
export * from "./context";


const foo = createHooksContext(() => {
    return 123;
})


export const hello = "world";