import { Observable, Subject } from "@tobes31415/basic-observables";
import { Action, getHookSlot, HookContext, HooksRunningContext } from "..";

const changeDetectionSlot = Symbol("Change Detector");

interface useChangeDetectionMeta {
    notifyFunction: Action;
    observable: Observable<void>;
    changesObserved: boolean;
}

export function useNotifyOfChangesDetected() {
    const slot = getRunningChangeDetectionSlot();

    return () => {
        if (!slot.changesObserved) {
            slot.changesObserved = true;
            slot.notifyFunction();
        }
    }
}

export function useListenForChangesDetected(): [Observable<void>, Action];
export function useListenForChangesDetected(ctx: HookContext<any>): [Observable<void>, Action];
export function useListenForChangesDetected(...args: any): any {
    let slot: useChangeDetectionMeta;
    if (args.length === 1) {
        const ctx = args[0] as HooksRunningContext;
        slot = ctx.getHookSlot<useChangeDetectionMeta>({ name: changeDetectionSlot, init: initFunction });
    } else {
        slot = getRunningChangeDetectionSlot();
    }
    const acknowledge = () => slot.changesObserved = false;
    return [slot.observable, acknowledge];
}

function getRunningChangeDetectionSlot() {
    return getHookSlot<useChangeDetectionMeta>({ name: changeDetectionSlot, init: initFunction });
}

function initFunction(slot: useChangeDetectionMeta) {
    const subject = new Subject<void>();
    slot.observable = subject;
    slot.notifyFunction = subject.next.bind(subject);

    return () => subject.complete();
}