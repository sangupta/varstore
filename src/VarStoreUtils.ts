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
const KEY_NOT_EXISTS_VALUE: ExistsWithValue = { exists: false, value: undefined };

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
        return undefined;
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
        return KEY_NOT_EXISTS_VALUE;
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
    return KEY_NOT_EXISTS_VALUE;
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

    context[id] = value;
    return true;
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
