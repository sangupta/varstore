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
export function getExistsWithValue(context: object, id: string): ExistsWithValue {
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

    // console.log('set value id: ', id);
    return setValueInternal(undefined, context, id, value);
}

function setValueInternal(parent: object, currentContext: object, id: string, value: any): boolean {
    // lets split on dot
    // even if the variable has no dot notation this will have no effect
    const dotIndex: number = id.indexOf('.');
    // console.log('does id: ', id, ' has a dot: ', dotIndex);
    if (dotIndex < 0) {
        // no child object
        // check for array
        const arrayIndex: number = id.indexOf('[');
        // console.log('does id: ', id, ' has a array: ', arrayIndex);
        if (arrayIndex < 0) {
            // not an array
            // console.log('[DONE] set value id: ', id, ' to value: ', value);
            currentContext[id] = value;
            return true;
        }

        throw new Error('set array not implemented');
    }

    const base: string = id.substring(0, dotIndex);
    const remaining: string = id.substring(dotIndex + 1);
    const current: ExistsWithValue = getExistsWithValue(currentContext, base);
    // console.log('finding: ', base, ' in context: ', currentContext);
    // console.log('exists: ', current);
    if (current.exists) {
        // base value exists
        return setValueInternal(currentContext, current.value, remaining, value);
    }

    // base value does not exist
    // we need to create a value first
    // it will be object or array depending on what base was
    const baseIsArray: number = base.indexOf('[');
    // console.log('check if var: ', base, ' is array: ', baseIsArray);
    if (baseIsArray < 0) {
        // console.log('base is not array');
        // create base as an object
        const created: object = {};
        // console.log('set ', base, ' to value to empty object');
        setValueInternal(parent, currentContext, base, created);

        // now recurse for remaining
        return setValueInternal(currentContext, created, remaining, value);
    }

    // this was an array
    // first create the array object itself
    const baseArrayVariable: string = base.substring(0, baseIsArray);
    const arrayIndexStr: string = base.substring(baseIsArray + 1, base.indexOf(']'));
    // console.log('extracted index: ', arrayIndexStr, ' from variable: ', baseArrayVariable);
    let created: any[] = [];

    // first create the base array variable
    setValueInternal(parent, currentContext, baseArrayVariable, created);

    // now we also need to create the object at index
    // now object at index could again be either an array or an object
    // so we need to find what is the next key - an array or an object
    let nextKeyEndIndex:number = id.indexOf('.', dotIndex + 1);
    if(nextKeyEndIndex < 0) {
        nextKeyEndIndex = id.length;
    }

    const nextKey:string = id.substr(dotIndex + 1, nextKeyEndIndex);
    // console.log('next key in id: ', id, ' from index: ', dotIndex, ' is: ', nextKey);

    const isNextKeyArray:boolean = nextKey.includes('[');
    const elementInArrayIndex = parseInt(arrayIndexStr);
    let createdChild;
    if(isNextKeyArray) {
        createdChild = [];
    } else {
        createdChild = {};
    }
    // console.log('elementInArrayIndex: ', elementInArrayIndex, ' set to: ', createdChild);
    created[elementInArrayIndex] = createdChild;

    // now set the value of the indexed component
    return setValueInternal(currentContext, createdChild, remaining, value);

    // if (tokens.length === 1) {
    //     context[id] = value;
    //     return true;
    // }

    // const base: string = tokens[0];
    // const isArray: boolean = base.includes('[');
    // if (!isArray) {
    //     // find the object in current context
    //     const child = currentContext[base];

    // }

    // // lets find the parent object to which we need to add
    // // this value
    // let current: object = context;
    // for (let index = 0; index < tokens.length - 1; index++) {
    //     let token: string = tokens[index];
    //     console.log('checking for token: ', token);
    //     const isArray: number = token.indexOf('[');

    //     if (isArray < 0) {
    //         // property is not indexed array
    //         console.log('not array');
    //         if (current.hasOwnProperty(token)) {
    //             console.log('has token');
    //             current = current[token];
    //             continue;
    //         }

    //         // the object does not exist
    //         // we need to create one here
    //         console.log('does not have token, creating empty object');
    //         const created: object = {};
    //         current[token] = created;
    //         current = created;
    //         continue;
    //     }

    //     // this is the part where this is an array
    //     console.log('is an array');
    //     const arrayToken: string = token.substring(0, isArray);
    //     const end: number = token.indexOf(']');
    //     let arrayIndex = token.substring(isArray + 1, end);

    //     console.log('token, array index: ', arrayToken, arrayIndex);

    //     // find the array
    //     if (current.hasOwnProperty(arrayToken)) {
    //         console.log('array, has own prop');
    //         current = current[arrayToken];
    //     } else {
    //         console.log('array, does not have token, creating empty array');
    //         const array = [];
    //         current[arrayToken] = array;
    //         current = array;
    //     }

    //     // just get the item
    //     let indexNum = parseInt(arrayIndex);
    //     console.log('parsed array num: ', indexNum);
    //     console.log('current: ', current);
    //     let inArray = current[indexNum];
    //     if(!inArray) {
    //         console.log('current inarray not valid: ', inArray);
    //     }
    //     current = inArray;
    // }

    // // `current` at this point contains the object
    // // to which the value is to be assigned
    // let lastToken: string = tokens[tokens.length - 1];

    // // check if last token itself is an array
    // const isArray: number = lastToken.indexOf('[');
    // // console.log('isArray: ', isArray);
    // if (isArray >= 0) {
    //     lastToken = lastToken.substring(0, isArray);
    //     const end: number = lastToken.indexOf(']');
    //     let arrayIndex = lastToken.substring(isArray + 1, end);
    //     let indexNum = parseInt(arrayIndex);

    //     let array = current[lastToken];
    //     if (typeof array === 'undefined') {
    //         current[lastToken] = [];
    //     }

    //     array[indexNum] = value;
    //     return true;
    // }

    // // for simple case set the value and we are done
    // current[lastToken] = value;
    // return true;
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
