import { Callback, Indexable, HookSlotRequest, HookContext } from "./types";
import * as gc from "@tobes31415/dispose";

interface ContextMemorySlot<State extends object = any> {
    state: State;
    update?: Callback<State>;
}

const currentExecutingStack: ContextInternalImplementation<any, any>[] = [];

export function getHookSlot<State extends object = any>(request: HookSlotRequest<State>): State {
    if (currentExecutingStack.length === 0) {
        throw new Error("No available context, you need to invoke the context before accessing it");
    }
    return currentExecutingStack[currentExecutingStack.length - 1].getSlot(request);
}

export function createHooksContext<Fn extends Function, FnThis extends object = any>(fnRef: Fn, fnThisRef?: FnThis): HookContext<Fn> {
    return new ContextInternalImplementation(fnRef, fnThisRef);
}


class ContextInternalImplementation<Fn extends Function, FnThis extends object = any> {
    readonly invoke: Fn;
    private indexedSlots: ContextMemorySlot[] = [];
    private namedSlots: Record<Indexable, ContextMemorySlot> = {};
    private slotNumber: number = 0;
    private isRunning: boolean = false;

    constructor(private fnRef: Fn, private fnThisRef?: FnThis) {
        this.invoke = this.invokeInternal.bind(this) as any;
        gc.onDisposeChain(this.invoke, this);
        gc.onDisposeChain(this, this.indexedSlots);
        gc.onDisposeChain(this, this.namedSlots);
        gc.onDisposeDisposeProperties(this.indexedSlots);
        gc.onDisposeDisposeProperties(this.namedSlots);
        gc.onDisposeDeleteProperties(this);
    }

    getSlot<State extends object = any>(request: HookSlotRequest<State>): State {
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