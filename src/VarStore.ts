import * as VarStoreUtils from "./VarStoreUtils";
import VarStoreEvaluator from "./VarStoreEvaluator";
import VarStoreParser, { NodeAndIdentifiers } from './VarStoreParser';

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
     * Holds a list of all watchers that are subscribed to
     * any key in this store.
     */
    private watchers: {} = {};

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
     * @param name the name of the new forked `varstore`
     * 
     * @param initialState the initial state that is merged
     * from the parent (which is `this` store)
     */
    fork(name: string, initialState: object = {}): VarStore {
        return new VarStore(name, initialState, this);
    }

    /**
     * Check if the variable exists in the store or
     * not.
     * 
     * @param id the key to be checked in store
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
     * @param id the key for which the value is needed
     */
    getValue(id: string): any {
        if(id === 'super') {
            return this.parent;
        }
        
        if(id.startsWith('super.')) {
            if(this.parent) {
                return this.parent.getValue(id.substring(6));
            }

            throw new Error('Reference to super is undefined for key: ' + id.substring(6));
        }

        const result: VarStoreUtils.ExistsWithValue = this.getVariable(id);
        if (result && result.exists) {
            return result.value;
        }

        return undefined;
    }

    /**
     * Get the variable and its existence from the store.
     * 
     * @param id the key for which existence and value are needed
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

    /**
     * Get the current context from this store.
     * 
     */
    private getContext(): object {
        return this.stack[this.stack.length - 1];
    }

    /**
     * Signal a touch on the key. This will invoke
     * any handlers that are attached to this key.
     * 
     * @param id the key that is touched
     * 
     * @param value (optional) the value to be sent to
     * watchers as part of this touch. If no value is
     * provided, the current value from store is sent.
     */
    touch(id: string, value: any = undefined): void {
        if (!id) {
            return;
        }

        // check for all subscribers and fire them
        let list: Array<Function> = this.watchers[id];
        if (!list) {
            return;
        }

        // get value from store
        if (value === undefined) {
            value = this.getValue(id);
        }

        // invoke each handler as a timeout
        list.forEach(handler => {
            setTimeout(handler, 0, [id, value]);
        });
    }

    /**
     * 
     * @param id
     * @param value 
     */
    setValue(id: string, value: any): boolean {
        if(id.startsWith('super.')) {
            if(this.parent) {
                this.parent.setValue(id.substring(6), value);
                return;
            }

            throw new Error('Reference to super is undefined for key: ' + id.substring(6));
        }

        const result = VarStoreUtils.setValue(this.getContext(), id, value);

        // invoke handlers
        this.touch(id, value);

        // return final result
        return result;
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

    /**
     * Evaluate the expression against this store.
     * 
     * @param expr string based expression to evaluate
     */
    evaluate(expr: string): any {
        return VarStoreEvaluator.evaluate(expr, this);
    }

    /**
     * Evaluate an already parsed node against this store.
     * 
     * @param node already parsed node
     */
    evaluateNode(node: any): any {
        return VarStoreEvaluator.evaluateNode(node, this);
    }

    /**
     * Parse a given expression and return its AST node.
     * 
     * @param expr 
     */
    parseExpression(expr: string): NodeAndIdentifiers {
        if (!expr) {
            return null;
        }

        return VarStoreParser.parse(expr);;
    }

    /**
     * Print debugging information
     */
    debug(): void {
        for (let i = 0; i < this.stack.length; i++) {
            let item = this.stack[i];
            console.log('@[' + i + ']: ', JSON.stringify(item));
        }
    }

    /**
     * Return the base store object. This does not return
     * the context's that were added to this store.
     */
    getStore(): any {
        if (this.stack.length === 0) {
            return {};
        }

        return this.stack[0];
    }

    /**
     * Subscribe the handler to the given key. This
     * allows for external clients to observe property
     * changes.
     * 
     * @param key 
     * @param handler 
     */
    subscribe(key: string, handler: Function): void {
        if (!key) {
            throw new Error('Need a key to subscribe with');
        }

        if (!handler) {
            throw new Error('Need a handler to be invoked');
        }

        if (key in this.watchers) {
            this.watchers[key].push(handler);
            return;
        }

        let list: Array<Function> = [];
        list.push(handler);
        this.watchers[key] = list;
    }

    /**
     * Remove a previously attached handler for the given key.
     * 
     * @param key key to which handler was bound
     * 
     * @param handler the handler to be removed
     */
    unsubscribe(key: string, handler: Function): void {
        if (!key) {
            throw new Error('Need a key to unsubscribe from');
        }

        if (!handler) {
            throw new Error('Need a handler to be removed');
        }

        if (key in this.watchers) {
            let list: Array<Function> = this.watchers[key];
            list = list.filter(item => item !== handler);
            this.watchers[key] = list;
        }
    }

}
