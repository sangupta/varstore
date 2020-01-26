import * as VarStoreUtils from "./VarStoreUtils";

/**
 * A scoped store that can be used to store variables 
 * and their respective values. It supports forking child
 * scopes, where children can access anything from parent,
 * but parent cannot read from any of the child store.
 * 
 */
export default class VarStore {

    private readonly parent: VarStore;

    /**
     * Holds states over stack so that we can evaluate
     * variables that are needed.
     * 
     */
    private readonly stack: object[] = [];
    /**
     * A human readable name for this store.
     */
    private readonly name: string;

    /**
     * The pointer to the actual scope. More context
     * can be added to the store and then popped, so we 
     * need to know where the base store is, to be able
     * to 
     */
    private scopePointer: number = -1;

    /**
     * Construct a freshly new store with no parent, and no
     * previous state.
     * 
     * @param name the human readable name for this store
     * 
     * @param initialState the initial state of this store
     */
    constructor(name: string, initialState: object = {}, parent: VarStore = undefined) {
        if (!name || name.trim() === '') {
            throw new Error('Name is required');
        }

        this.name = name;
        this.parent = parent;
        this.stack.push(initialState);
    }

    /**
     * Read the name of this store.
     */
    getName(): string {
        return this.name;
    }

    /**
     * Create a new scoped store for the given parent and
     * given additional initial state.
     * 
     * @param parent 
     * @param additionalContext 
     */
    fork(name: string, initialState: object = {}): VarStore {
        return new VarStore(name, initialState, this);
    }

    /**
     * Check if the variable exists in the store or
     * not.
     * 
     * @param id 
     */
    exists(id: string): boolean {
        const result: VarStoreUtils.ExistsWithValue = this.getVariable(id);
        if (result) {
            return result.exists;
        }

        return false;
    }

    /**
     * Get the value of the variable stored in
     * this store.
     * 
     * @param id
     */
    getValue(id: string): any {
        const result: VarStoreUtils.ExistsWithValue = this.getVariable(id);
        if (result && result.exists) {
            return result.value;
        }

        return undefined;
    }

    /**
     * Get the variable and its existence from the store.
     * 
     * @param id 
     */
    private getVariable(id: string): VarStoreUtils.ExistsWithValue {
        if (this.stack.length === 0) {
            return undefined;
        }

        const endIndex: number = this.stack.length - 1;
        for (let index: number = endIndex; index >= 0; index--) {
            let context: object = this.stack[index];

            const result: VarStoreUtils.ExistsWithValue = VarStoreUtils.getExistsWithValue(context, id);
            if (result.exists) {
                return result;
            }
        }

        // we have exhausted all context here, start checking for parent
        let parent: VarStore = this.parent;
        while (parent) {
            let baseContext: object = parent.stack[0];

            const result: VarStoreUtils.ExistsWithValue = VarStoreUtils.getExistsWithValue(baseContext, id);
            if (result.exists) {
                return result;
            }

            // loop through parents
            parent = parent.parent;
        }

        return undefined;
    }

    private getContext(): object {
        return this.stack[this.stack.length - 1];
    }

    /**
     * 
     * @param id
     * @param value 
     */
    setValue(id: string, value: any): boolean {
        return VarStoreUtils.setValue(this.getContext(), id, value);
    }

    /**
     * Update the current state of this store.
     * 
     * @param state 
     */
    updateState(state: object): void {
        const merged: object = VarStoreUtils.merge(this.stack[0], state);
        if (merged) {
            this.stack[0] = merged;
        }
    }

    /**
     * Push a new context in the store.
     * 
     * @param context 
     */
    pushContext(context: object = {}) {
        this.stack.push(context);
    }

    /**
     * Pop the top-most context from the stack.
     * 
     */
    popContext(): object {
        return this.stack.pop();
    }
}
