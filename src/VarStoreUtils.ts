/**
 * Interface to specify contract to return a
 * value and its existence in store.
 */
export interface ExistsWithValue {

    /**
     * Specifies whether key existed in context or not
     */
    exists: boolean;

    /**
     * The value as it existed
     */
    value: any;

}

/**
 * Constant that indicates that value does not exist, and is thus undefined
 */
const KEY_NOT_EXISTS: ExistsWithValue = { exists: false, value: undefined };

/**
 * Check if a key exists in the given context and also return
 * its value if it is available.
 * 
 * @param context context to look variable in
 * 
 * @param id the variable to look for
 */
export function getExistsWithValue(context: object, id: string): any {
    if (!id) {
        return KEY_NOT_EXISTS;
    }

    // check if we have a dot notation
    const hasDot: boolean = id.includes('.');
    const isArray: boolean = id.includes('[');

    if (hasDot) {
        return getExistsWithValueComplex(context, id);
    }

    if (isArray) {
        return getExistsWithValueForArray(context, id);
    }

    return getExistsWithValueSimple(context, id);
}

/**
 * Find a variable in the store that uses dot notation to
 * represent child properties within an object.
 * 
 * @param context context to look variable in
 * 
 * @param id the variable to look for
 */
function getExistsWithValueComplex(context: object, id: string): ExistsWithValue {
    // split up on dots first
    // and then figure out the value
    const tokens: string[] = id.split('.');
    let currentContext = context;

    // iterate over each token/dot
    for (let index: number = 0; index < tokens.length; index++) {
        if (typeof currentContext === 'undefined') {
            return KEY_NOT_EXISTS;
        }

        let token: string = tokens[index];
        let result: ExistsWithValue;

        if (token.includes('[')) {
            result = getExistsWithValueForArray(currentContext, token);
        } else {
            result = getExistsWithValueSimple(currentContext, token);
        }

        if (!result.exists) {
            return result;
        }

        currentContext = result.value;
    }

    return { exists: true, value: currentContext };
}

/**
 * Find a variable in the store that just specifies a simple
 * string to reference a variable.
 * 
 * @param context context to look variable in
 * 
 * @param id the variable to look for
 */
function getExistsWithValueSimple(context: object, id: string): ExistsWithValue {
    if (!context.hasOwnProperty(id)) {
        return KEY_NOT_EXISTS;
    }

    return { exists: true, value: context[id] };
}

/**
 * Find a variable in the store that is specified as an array
 * element access with index value.
 * 
 * @param context context to look variable in
 * 
 * @param id the variable to look for
 */
function getExistsWithValueForArray(context: object, id: string): ExistsWithValue {
    const start: number = id.indexOf('[');
    const end: number = id.indexOf(']');
    const variable: string = id.substring(0, start);
    const index: string = id.substring(start + 1, end);

    let result: ExistsWithValue = getExistsWithValueSimple(context, variable);
    if (!result.exists) {
        return KEY_NOT_EXISTS;
    }

    if (typeof result.value === 'undefined') {
        throw new Error('Variable not initialized');
    }

    if (result.value === null) {
        throw new Error('Variable is null');
    }

    const isArray: boolean = Array.isArray(result.value);
    const isObject: boolean = typeof result.value === 'object';

    if (!(isArray || isObject)) {
        throw new Error('Variable is not an array/object');
    }

    // parse the index now
    let num: number = parseInt(index);
    if (isNaN(num)) {
        // try string based key operation
        return { exists: true, value: result.value[index] };
    }

    // try index based return
    return { exists: true, value: result.value[index] };
}

/**
 * Set the given key/value pair in the given context
 * 
 * @param context 
 * @param id 
 * @param value 
 */
export function setValue(context: object, id: string, value: any): boolean {
    if (!context) {
        return false;
    }

    if (!id) {
        return false;
    }

    // lets split on dot
    // even if the variable has no dot notation this will have no effect
    const tokens: string[] = id.split('.');

    // lets find the parent object to which we need to add
    // this value
    let current: object = context;
    for (let index = 0; index < tokens.length - 1; index++) {
        let token: string = tokens[index];
        const isArray: boolean = token.includes('[');

        if (!isArray) {
            // property is not indexed array
            if (current.hasOwnProperty(token)) {
                current = current[token];
                continue;
            }

            // the object does not exist
            // we need to create one here
            const created: object = {};
            current[token] = created;
            current = created;
            continue;
        }

        // this is the part where this is an array
        throw new Error('case "array in parent" not yet handled');
    }

    // `current` at this point contains the object
    // to which the value is to be assigned
    const lastToken:string = tokens[tokens.length - 1];

    // check if last token itself is an array
    const isArray:boolean = lastToken.includes('[');
    if(isArray) {
        throw new Error('case "array in last" not yet handled');
    }

    // for simple case set the value and we are done
    current[lastToken] = value;
    return true;
}

function setValueArray(context: object, id: string, value: any): boolean {
    return false;
}

/**
 * Mere the state over the given context and return the updated
 * context.
 *
 * @param context 
 * @param state 
 */
export function merge(context: object, state: object): object {
    if (!context) {
        return undefined;
    }

    if (!state) {
        return undefined;
    }

    if (typeof state !== 'object') {
        return undefined;
    }

    return Object.assign({}, context, state);
}
