/**
 * The following parser code is borrowed from JSEP project.
 * 
 * Refer https://github.com/soney/jsep for more details
 */

/**
 * This is the full set of types that any JSEP node can be.
 * Store them here to save space when minified
 */
const COMPOUND = 'Compound',
    IDENTIFIER = 'Identifier',
    MEMBER_EXP = 'MemberExpression',
    LITERAL = 'Literal',
    THIS_EXP = 'ThisExpression',
    CALL_EXP = 'CallExpression',
    UNARY_EXP = 'UnaryExpression',
    BINARY_EXP = 'BinaryExpression',
    LOGICAL_EXP = 'LogicalExpression',
    CONDITIONAL_EXP = 'ConditionalExpression',
    ARRAY_EXP = 'ArrayExpression',

    PERIOD_CODE = 46, // '.'
    COMMA_CODE = 44, // ','
    SQUOTE_CODE = 39, // single quote
    DQUOTE_CODE = 34, // double quotes
    OPAREN_CODE = 40, // (
    CPAREN_CODE = 41, // )
    OBRACK_CODE = 91, // [
    CBRACK_CODE = 93, // ]
    QUMARK_CODE = 63, // ?
    SEMCOL_CODE = 59, // ;
    COLON_CODE = 58; // :

/**
 * Use a quickly-accessible map to store all of the unary operators
 * Values are set to `true` (it really doesn't matter)
 */
const unary_ops = { '-': true, '!': true, '~': true, '+': true };

/**
 * Also use a map for the binary operations but set their values to their
 * binary precedence for quick reference:
 * see [Order of operations](http://en.wikipedia.org/wiki/Order_of_operations#Programming_language)
 */
const binary_ops = {
    '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
    '==': 6, '!=': 6, '===': 6, '!==': 6,
    '<': 7, '>': 7, '<=': 7, '>=': 7,
    '<<': 8, '>>': 8, '>>>': 8,
    '+': 9, '-': 9,
    '*': 10, '/': 10, '%': 10
}

/**
 * Get return the longest key length of any object
 * 
 * @param obj 
 */
function getMaxKeyLen(obj: object): number {
    let max_len: number = 0, len: number;
    for (let key in obj) {
        if ((len = key.length) > max_len && obj.hasOwnProperty(key)) {
            max_len = len;
        }
    }
    return max_len;
}

const max_unop_len = getMaxKeyLen(unary_ops);

const max_binop_len = getMaxKeyLen(binary_ops);

const literals = {
    'true': true,
    'false': false,
    'null': null
};

const this_str = 'this';

/**
 * Returns the precedence of a binary operator or `0` if it isn't a binary operator
 * 
 * @param op_val 
 */
function binaryPrecedence(op_val) {
    return binary_ops[op_val] || 0;
}

/**
 * Utility function (gets called from multiple places)
 * Also note that `a && b` and `a || b` are *logical* expressions, 
 * not binary expressions.
 * 
 * @param operator 
 * @param left 
 * @param right 
 */
function createBinaryExpression(operator, left, right) {
    var type = (operator === '||' || operator === '&&') ? LOGICAL_EXP : BINARY_EXP;
    return {
        type: type,
        operator: operator,
        left: left,
        right: right
    };
}

/**
 * `ch` is a character code in the next three functions
 * 
 * @param ch 
 */
function isDecimalDigit(ch: number): boolean {
    return (ch >= 48 && ch <= 57); // 0...9
}

function isIdentifierStart(ch: number): boolean {
    return (ch === 36) || (ch === 95) || // `$` and `_`
        (ch >= 65 && ch <= 90) || // A...Z
        (ch >= 97 && ch <= 122) || // a...z
        (ch >= 128 && !binary_ops[String.fromCharCode(ch)]); // any non-ASCII that is not an operator
}

function isIdentifierPart(ch: number): boolean {
    return (ch === 36) || (ch === 95) || // `$` and `_`
        (ch >= 65 && ch <= 90) || // A...Z
        (ch >= 97 && ch <= 122) || // a...z
        (ch >= 48 && ch <= 57) || // 0...9
        (ch >= 128 && !binary_ops[String.fromCharCode(ch)]); // any non-ASCII that is not an operator
}

export default class VarStoreParser {

    /**
     * `index` stores the character number we are currently at while `length` is a 
     * constant. All of the gobbles below will modify `index` as we move along
     */
    index = 0;

    expr: string;

    length: number;

    constructor(expr: string) {
        this.expr = expr;
        this.length = expr.length;
    }

    static parse(expr: string): object {
        return new VarStoreParser(expr).parseExpr();
    }

    exprI(i) {
        return this.expr.charAt(i);
    }

    exprICode(i) {
        return this.expr.charCodeAt(i);
    }

    throwError(message, index) {
        var error: any = new Error(message + ' at character ' + index);
        error.index = index;
        error.description = message;
        throw error;
    }

    /**
     * Push `index` up to the next non-space character
     */
    gobbleSpaces() {
        var ch = this.exprICode(this.index);
        // space or tab
        while (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
            ch = this.exprICode(++this.index);
        }
    }

    /**
     * The main parsing function. Much of this code is dedicated to ternary expressions
     */
    gobbleExpression() {
        var test = this.gobbleBinaryExpression(),
            consequent, alternate;
        this.gobbleSpaces();
        if (this.exprICode(this.index) === QUMARK_CODE) {
            // Ternary expression: test ? consequent : alternate
            this.index++;
            consequent = this.gobbleExpression();
            if (!consequent) {
                this.throwError('Expected expression', this.index);
            }
            this.gobbleSpaces();
            if (this.exprICode(this.index) === COLON_CODE) {
                this.index++;
                alternate = this.gobbleExpression();
                if (!alternate) {
                    this.throwError('Expected expression', this.index);
                }
                return {
                    type: CONDITIONAL_EXP,
                    test: test,
                    consequent: consequent,
                    alternate: alternate
                };
            } else {
                this.throwError('Expected :', this.index);
            }
        } else {
            return test;
        }
    }

    /**
     * Search for the operation portion of the string (e.g. `+`, `===`)
     * Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
     * and move down from 3 to 2 to 1 character until a matching binary operation is found
     * then, return that binary operation
     */
    gobbleBinaryOp() {
        this.gobbleSpaces();
        var biop, to_check = this.expr.substr(this.index, max_binop_len), tc_len = to_check.length;
        while (tc_len > 0) {
            // Don't accept a binary op when it is an identifier.
            // Binary ops that start with a identifier-valid character must be followed
            // by a non identifier-part valid character
            if (binary_ops.hasOwnProperty(to_check) && (
                !isIdentifierStart(this.exprICode(this.index)) ||
                (this.index + to_check.length < this.expr.length && !isIdentifierPart(this.exprICode(this.index + to_check.length)))
            )) {
                this.index += tc_len;
                return to_check;
            }
            to_check = to_check.substr(0, --tc_len);
        }
        return false;
    }

    /**
     * This function is responsible for gobbling an individual expression,
     * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
     */
    gobbleBinaryExpression() {
        var ch_i, node, biop, prec, stack, biop_info, left, right, i, cur_biop;

        // First, try to get the leftmost thing
        // Then, check to see if there's a binary operator operating on that leftmost thing
        left = this.gobbleToken();
        biop = this.gobbleBinaryOp();

        // If there wasn't a binary operator, just return the leftmost node
        if (!biop) {
            return left;
        }

        // Otherwise, we need to start a stack to properly place the binary operations in their
        // precedence structure
        biop_info = { value: biop, prec: binaryPrecedence(biop) };

        right = this.gobbleToken();
        if (!right) {
            this.throwError("Expected expression after " + biop, this.index);
        }
        stack = [left, biop_info, right];

        // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
        while ((biop = this.gobbleBinaryOp())) {
            prec = binaryPrecedence(biop);

            if (prec === 0) {
                break;
            }
            biop_info = { value: biop, prec: prec };

            cur_biop = biop;
            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                biop = stack.pop().value;
                left = stack.pop();
                node = createBinaryExpression(biop, left, right);
                stack.push(node);
            }

            node = this.gobbleToken();
            if (!node) {
                this.throwError("Expected expression after " + cur_biop, this.index);
            }
            stack.push(biop_info, node);
        }

        i = stack.length - 1;
        node = stack[i];
        while (i > 1) {
            node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node);
            i -= 2;
        }
        return node;
    }

    /**
     * An individual part of a binary expression:
     * e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
     */
    gobbleToken = function () {
        var ch, to_check, tc_len;

        this.gobbleSpaces();
        ch = this.exprICode(this.index);

        if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
            // Char code 46 is a dot `.` which can start off a numeric literal
            return this.gobbleNumericLiteral();
        } else if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
            // Single or double quotes
            return this.gobbleStringLiteral();
        } else if (ch === OBRACK_CODE) {
            return this.gobbleArray();
        } else {
            to_check = this.expr.substr(this.index, max_unop_len);
            tc_len = to_check.length;
            while (tc_len > 0) {
                // Don't accept an unary op when it is an identifier.
                // Unary ops that start with a identifier-valid character must be followed
                // by a non identifier-part valid character
                if (unary_ops.hasOwnProperty(to_check) && (
                    !isIdentifierStart(this.exprICode(this.index)) ||
                    (this.index + to_check.length < this.expr.length && !isIdentifierPart(this.exprICode(this.index + to_check.length)))
                )) {
                    this.index += tc_len;
                    return {
                        type: UNARY_EXP,
                        operator: to_check,
                        argument: this.gobbleToken(),
                        prefix: true
                    };
                }
                to_check = to_check.substr(0, --tc_len);
            }

            if (isIdentifierStart(ch) || ch === OPAREN_CODE) { // open parenthesis
                // `foo`, `bar.baz`
                return this.gobbleVariable();
            }
        }

        return false;
    }

    /**
     * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
     * keep track of everything in the numeric literal and then calling `parseFloat` on that string
     */
    gobbleNumericLiteral() {
        var number = '', ch, chCode;
        while (isDecimalDigit(this.exprICode(this.index))) {
            number += this.exprI(this.index++);
        }

        if (this.exprICode(this.index) === PERIOD_CODE) { // can start with a decimal marker
            number += this.exprI(this.index++);

            while (isDecimalDigit(this.exprICode(this.index))) {
                number += this.exprI(this.index++);
            }
        }

        ch = this.exprI(this.index);
        if (ch === 'e' || ch === 'E') { // exponent marker
            number += this.exprI(this.index++);
            ch = this.exprI(this.index);
            if (ch === '+' || ch === '-') { // exponent sign
                number += this.exprI(this.index++);
            }
            while (isDecimalDigit(this.exprICode(this.index))) { //exponent itself
                number += this.exprI(this.index++);
            }
            if (!isDecimalDigit(this.exprICode(this.index - 1))) {
                this.throwError('Expected exponent (' + number + this.exprI(this.index) + ')', this.index);
            }
        }


        chCode = this.exprICode(this.index);
        // Check to make sure this isn't a variable name that start with a number (123abc)
        if (isIdentifierStart(chCode)) {
            this.throwError('Variable names cannot start with a number (' +
                number + this.exprI(this.index) + ')', this.index);
        } else if (chCode === PERIOD_CODE) {
            this.throwError('Unexpected period', this.index);
        }

        return {
            type: LITERAL,
            value: parseFloat(number),
            raw: number
        };
    }

    /**
     * Parses a string literal, staring with single or double quotes with basic support for escape codes
     * e.g. `"hello world"`, `'this is\nJSEP'`
     */
    gobbleStringLiteral = function () {
        var str = '', quote = this.exprI(this.index++), closed = false, ch;

        while (this.index < this.length) {
            ch = this.exprI(this.index++);
            if (ch === quote) {
                closed = true;
                break;
            } else if (ch === '\\') {
                // Check for all of the common escape codes
                ch = this.exprI(this.index++);
                switch (ch) {
                    case 'n': str += '\n'; break;
                    case 'r': str += '\r'; break;
                    case 't': str += '\t'; break;
                    case 'b': str += '\b'; break;
                    case 'f': str += '\f'; break;
                    case 'v': str += '\x0B'; break;
                    default: str += ch;
                }
            } else {
                str += ch;
            }
        }

        if (!closed) {
            this.throwError('Unclosed quote after "' + str + '"', this.index);
        }

        return {
            type: LITERAL,
            value: str,
            raw: quote + str + quote
        };
    }

    /**
     * Gobbles only identifiers
     * e.g.: `foo`, `_value`, `$x1`
     * Also, this function checks if that identifier is a literal:
     * (e.g. `true`, `false`, `null`) or `this`
     */
    gobbleIdentifier() {
        var ch = this.exprICode(this.index), start = this.index, identifier;

        if (isIdentifierStart(ch)) {
            this.index++;
        } else {
            this.throwError('Unexpected ' + this.exprI(this.index), this.index);
        }

        while (this.index < this.length) {
            ch = this.exprICode(this.index);
            if (isIdentifierPart(ch)) {
                this.index++;
            } else {
                break;
            }
        }
        identifier = this.expr.slice(start, this.index);

        if (literals.hasOwnProperty(identifier)) {
            return {
                type: LITERAL,
                value: literals[identifier],
                raw: identifier
            };
        } else if (identifier === this_str) {
            return { type: THIS_EXP };
        } else {
            return {
                type: IDENTIFIER,
                name: identifier
            };
        }
    }

    /**
     * Gobbles a list of arguments within the context of a function call
     * or array literal. This function also assumes that the opening character
     * `(` or `[` has already been gobbled, and gobbles expressions and commas
     * until the terminator character `)` or `]` is encountered.
     * e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
     */
    gobbleArguments = function (termination) {
        var ch_i, args = [], node, closed = false;
        var separator_count = 0;
        while (this.index < length) {
            this.gobbleSpaces();
            ch_i = this.exprICode(this.index);
            if (ch_i === termination) { // done parsing
                closed = true;
                this.index++;
                if (termination === CPAREN_CODE && separator_count && separator_count >= args.length) {
                    this.throwError('Unexpected token ' + String.fromCharCode(termination), this.index);
                }
                break;
            } else if (ch_i === COMMA_CODE) { // between expressions
                this.index++;
                separator_count++;
                if (separator_count !== args.length) { // missing argument
                    if (termination === CPAREN_CODE) {
                        this.throwError('Unexpected token ,', this.index);
                    }
                    else if (termination === CBRACK_CODE) {
                        for (var arg = args.length; arg < separator_count; arg++) {
                            args.push(null);
                        }
                    }
                }
            } else {
                node = this.gobbleExpression();
                if (!node || node.type === COMPOUND) {
                    this.throwError('Expected comma', this.index);
                }
                args.push(node);
            }
        }
        if (!closed) {
            this.throwError('Expected ' + String.fromCharCode(termination), this.index);
        }
        return args;
    }

    /**
     * Gobble a non-literal variable name. This variable name may include properties
     * e.g. `foo`, `bar.baz`, `foo['bar'].baz`
     * It also gobbles function calls:
     * e.g. `Math.acos(obj.angle)`
     */
    gobbleVariable = function () {
        var ch_i, node;
        ch_i = this.exprICode(this.index);

        if (ch_i === OPAREN_CODE) {
            node = this.gobbleGroup();
        } else {
            node = this.gobbleIdentifier();
        }
        this.gobbleSpaces();
        ch_i = this.exprICode(this.index);
        while (ch_i === PERIOD_CODE || ch_i === OBRACK_CODE || ch_i === OPAREN_CODE) {
            this.index++;
            if (ch_i === PERIOD_CODE) {
                this.gobbleSpaces();
                node = {
                    type: MEMBER_EXP,
                    computed: false,
                    object: node,
                    property: this.gobbleIdentifier()
                };
            } else if (ch_i === OBRACK_CODE) {
                node = {
                    type: MEMBER_EXP,
                    computed: true,
                    object: node,
                    property: this.gobbleExpression()
                };
                this.gobbleSpaces();
                ch_i = this.exprICode(this.index);
                if (ch_i !== CBRACK_CODE) {
                    this.throwError('Unclosed [', this.index);
                }
                this.index++;
            } else if (ch_i === OPAREN_CODE) {
                // A function call is being made; gobble all the arguments
                node = {
                    type: CALL_EXP,
                    'arguments': this.gobbleArguments(CPAREN_CODE),
                    callee: node
                };
            }
            this.gobbleSpaces();
            ch_i = this.exprICode(this.index);
        }
        return node;
    }

    /**
     * Responsible for parsing a group of things within parentheses `()`
     * This function assumes that it needs to gobble the opening parenthesis
     * and then tries to gobble everything within that parenthesis, assuming
     * that the next thing it should see is the close parenthesis. If not,
     * then the expression probably doesn't have a `)`
     */
    gobbleGroup() {
        this.index++;
        var node = this.gobbleExpression();
        this.gobbleSpaces();
        if (this.exprICode(this.index) === CPAREN_CODE) {
            this.index++;
            return node;
        } else {
            this.throwError('Unclosed (', this.index);
        }
    }

    /**
     * Responsible for parsing Array literals `[1, 2, 3]`
     * This function assumes that it needs to gobble the opening bracket
     * and then tries to gobble the expressions as arguments.
     */
    gobbleArray() {
        this.index++;
        return {
            type: ARRAY_EXP,
            elements: this.gobbleArguments(CBRACK_CODE)
        };
    }

    parseExpr() {
        let nodes = [], ch_i, node;
        while (this.index < this.length) {
            ch_i = this.exprICode(this.index);

            // Expressions can be separated by semicolons, commas, or just inferred without any
            // separators
            if (ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
                this.index++; // ignore separators
            } else {
                // Try to gobble each expression individually
                if ((node = this.gobbleExpression())) {
                    nodes.push(node);
                    // If we weren't able to find a binary expression and are out of room, then
                    // the expression passed in probably has too much
                } else if (this.index < length) {
                    this.throwError('Unexpected "' + this.exprI(this.index) + '"', this.index);
                }
            }
        }

        // If there's only one expression just try returning the expression
        if (nodes.length === 1) {
            return nodes[0];
        } else {
            return {
                type: COMPOUND,
                body: nodes
            };
        }
    }
}