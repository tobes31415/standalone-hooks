
export type Action = () => void;
export type Callback<T> = (value: T) => void;
export type Generator<T> = () => T;
export type Transformer<Tin, TOut> = (value: Tin) => TOut;

export type Indexable = string | number | symbol;

export interface HookContext<Fn extends Function> {
    invoke: Fn;
    dispose: Action;
}

export interface HookSlotRequest<State extends object = any> {
    name?: Indexable;
    init?: Transformer<State, Action> | Transformer<State, Callback<State>> | Callback<State>;
    update?: Callback<State> | Action;
}


