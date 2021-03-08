import VarStoreParser, { Node, NodeAndIdentifiers } from './VarStoreParser';
import VarStore from './VarStore';

/**
 * The following code has been borrowed from
 * https://github.com/donmccurdy/expression-eval
 * Copyright (c) 2017 Don McCurdy
 * 
 * Changes have been made to use `varstore` as
 * the context being passed than using a pure object.
 */
const binops = {
    '||': function (a, b) { return a || b; },
    '&&': function (a, b) { return a && b; },
    '|': function (a, b) { return a | b; },
    '^': function (a, b) { return a ^ b; },
    '&': function (a, b) { return a & b; },
    '==': function (a, b) { return a == b; }, // jshint ignore:line
    '!=': function (a, b) { return a != b; }, // jshint ignore:line
    '===': function (a, b) { return a === b; },
    '!==': function (a, b) { return a !== b; },
    '<': function (a, b) { return a < b; },
    '>': function (a, b) { return a > b; },
    '<=': function (a, b) { return a <= b; },
    '>=': function (a, b) { return a >= b; },
    '<<': function (a, b) { return a << b; },
    '>>': function (a, b) { return a >> b; },
    '>>>': function (a, b) { return a >>> b; },
    '+': function (a, b) { return a + b; },
    '-': function (a, b) { return a - b; },
    '*': function (a, b) { return a * b; },
    '/': function (a, b) { return a / b; },
    '%': function (a, b) { return a % b; }
};

const unops = {
    '-': function (a) { return -a; },
    '+': function (a) { return +a; },
    '~': function (a) { return ~a; },
    '!': function (a) { return !a; },
};

function evaluateArray(list, context: VarStore) {
    return list.map(function (v) {
        return evaluate(v, context);
    });
}

function evaluateMember(node: Node, context: VarStore) {
    const object = evaluate(node.object, context);

    let prop = node.computed ? evaluate(node.property, context) : node.property.name;
    if(object instanceof VarStore) {
        return [object, object.getValue(prop)];
    }
    
    return [object, object[prop]];
}

function evaluate(node: Node, context: VarStore) {
    switch (node.type) {
        case 'ArrayExpression':
            return evaluateArray(node.elements, context);

        case 'BinaryExpression':
            return binops[node.operator](evaluate(node.left, context), evaluate(node.right, context));

        case 'CallExpression':
            let caller, fn, assign;
            if (node.callee.type === 'MemberExpression') {
                assign = evaluateMember(node.callee, context);
                caller = assign[0];
                fn = assign[1];
            } else {
                fn = evaluate(node.callee, context);
            }

            if (typeof fn !== 'function') {
                return undefined;
            }

            return fn.apply(caller, evaluateArray(node.arguments, context));

        case 'ConditionalExpression':
            return evaluate(node.test, context)
                ? evaluate(node.consequent, context)
                : evaluate(node.alternate, context);

        case 'Identifier':
            return context.getValue(node.name);

        case 'Literal':
            return node.value;

        case 'LogicalExpression':
            if (node.operator === '||') {
                return evaluate(node.left, context) || evaluate(node.right, context);
            } else if (node.operator === '&&') {
                return evaluate(node.left, context) && evaluate(node.right, context);
            }
            return binops[node.operator](evaluate(node.left, context), evaluate(node.right, context));

        case 'MemberExpression':
            return evaluateMember(node, context)[1];

        case 'ThisExpression':
            return context;

        case 'UnaryExpression':
            return unops[node.operator](evaluate(node.argument, context));

        default:
            return undefined;
    }

}

export default class VarStoreEvaluator {

    static evaluateNode(node: Node, store: VarStore): any {
        if (!node) {
            throw new Error('Node to evaluate cannot be null');
        }

        return evaluate(node, store);
    }

    static evaluate(expr: string, store: VarStore): any {
        const parsedExpr: NodeAndIdentifiers = VarStoreParser.parse(expr);
        console.log('parsed node: ', parsedExpr);
        return VarStoreEvaluator.evaluateNode(parsedExpr.node, store);
    }

}
