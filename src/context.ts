import { Callback, Indexable, Transformer, HookSlotRequest, HookContext ,HooksRunningContext} from "./types";
import * as gc from "@tobes31415/dispose";
import { findLast } from "./util";

interface ContextMemorySlot<State extends object = any> {
    state: State;
    update?: Callback<State>;
}

const currentExecutingStack: ContextInternalImplementation<any, any>[] = [];

export function getHookSlot<State extends object = any>(name: Indexable): State;
export function getHookSlot<State extends object = any>(request: HookSlotRequest<State>): State;
export function getHookSlot<State extends object = any>(request: any): State {
    if (currentExecutingStack.length === 0) {
        throw new Error("No available context, you need to invoke the context before accessing it");
    }
    if (typeof request === "object") {
        return currentExecutingStack[currentExecutingStack.length - 1].getHookSlot(request);
    } else {
        return getHookSlot({ name: request });
    }
}

export function createHooksContext<Fn extends Function, FnThis extends object = any>(fnRef: Fn, fnThisRef?: FnThis): HookContext<Fn> {
    return new ContextInternalImplementation(fnRef, fnThisRef);
}

function findRunningContext(predicate: Transformer<HooksRunningContext, boolean>, ignoreCurrentContext: boolean = true): HooksRunningContext | undefined {
    return findLast(currentExecutingStack as HooksRunningContext[], predicate, ignoreCurrentContext ? 1 : 0);
}

export function findParentHookSlot<State extends object = any>(name: Indexable): State | undefined {
    const parentContext = findRunningContext(context => context.hasHookSlot(name));
    return parentContext?.getHookSlot({name});
}

class ContextInternalImplementation<Fn extends Function, FnThis extends object = any> implements HooksRunningContext {
    readonly invoke: Fn;
    private indexedSlots: ContextMemorySlot[] = [];
    private namedSlots: Record<Indexable, ContextMemorySlot> = {};
    private slotNumber: number = 0;
    private isRunning: boolean = false;

    constructor(private fnRef: Fn, private fnThisRef?: FnThis) {
        this.invoke = this.invokeInternal.bind(this) as any;
        gc.onDisposeChain(this.invoke, this);
        gc.onDisposeChain(this, this.invoke);
        gc.onDisposeChain(this, this.indexedSlots);
        gc.onDisposeChain(this, this.namedSlots);
        gc.onDisposeDisposeProperties(this.indexedSlots);
        gc.onDisposeDisposeProperties(this.namedSlots);
        gc.onDisposeDeleteProperties(this);
    }

    hasHookSlot(name: Indexable): boolean {
        return !!this.indexedSlots[name as any];
    }

    getHookSlot<State extends object = any>(request: HookSlotRequest<State>): State {
        gc.assertNotDisposed(this, "Context has been disposed");
        if (request.name !== null && request.name !== undefined) {
            return ContextInternalImplementation.getSlotInternal(this.namedSlots, request);
        } else {
            return ContextInternalImplementation.getSlotInternal(this.indexedSlots as any, { ...request, name: this.slotNumber++ });
        }
    }

    dispose(): void {
        gc.dispose(this);
    }

    private invokeInternal(...args: any[]): any {
        gc.assertNotDisposed(this, "Context has been disposed");
        if (this.isRunning) {
            throw new Error("Context re-entry detected, invoke must wait before previous call finishes")
        }
        currentExecutingStack.push(this);
        const expectedLength = currentExecutingStack.length;
        try {
            this.isRunning = true;
            this.slotNumber = 0;

            return this.fnRef.apply(this.fnThisRef, ...args);
        }
        finally {
            if (currentExecutingStack.length !== expectedLength) {
                throw new Error("Sequence violation, contexts must be executed synchronously")
            }
            currentExecutingStack.pop();
            this.isRunning = false;
        }
    }

    private static getSlotInternal<State extends object = any>(slotMap: Record<Indexable, ContextMemorySlot<State>>, request: HookSlotRequest<State>): State {
        const index = request.name!;
        if (!slotMap[index]) {
            this.createNewSlot(slotMap, request);
        }
        const slot = slotMap[index];
        if (slot.update) {
            slot.update(slot.state);
        }
        return slot.state;
    }

    private static createNewSlot<State extends object = any>(slotMap: Record<Indexable, ContextMemorySlot<State>>, request: HookSlotRequest<State>): void {
        const slot: ContextMemorySlot = { state: {} };

        slotMap[request.name!] = slot;
        if (request.init) {
            const dispose = request.init(slot.state) || undefined;
            if (dispose) {
                gc.onDispose(slot, () => dispose(slot.state));
            }
        }
        slot.update = request.update;

        gc.onDisposeDisposeProperties(slot.state);
        gc.onDisposeDeleteProperties(slot.state);
        gc.onDisposeDisposeProperties(slot);
        gc.onDisposeDeleteProperties(slot);
    }
}