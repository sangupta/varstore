import { describe, it } from 'mocha';
import { expect } from 'chai';
import VarStoreParser from './../src/VarStoreParser';

describe('VarStoreParser', () => {

    it('Test for constants', () => {
        expect(VarStoreParser.parse("'abc'")).to.deep.equal({ type: 'Literal', value: 'abc', raw: "'abc'" });
        expect(VarStoreParser.parse('"abc"')).to.deep.equal({ type: 'Literal', value: 'abc', raw: '"abc"' });
        expect(VarStoreParser.parse('123')).to.deep.equal({ type: 'Literal', value: 123, raw: '123' });
        expect(VarStoreParser.parse('12.3')).to.deep.equal({ type: 'Literal', value: 12.3, raw: '12.3' });
    });

    it('Test for unary constants', () => {
        // unary constants
        expect(VarStoreParser.parse('+123')).to.deep.equal({
            type: 'UnaryExpression',
            operator: '+',
            argument: { type: 'Literal', value: 123, raw: '123' },
            prefix: true
        });
        expect(VarStoreParser.parse('-123')).to.deep.equal({
            type: 'UnaryExpression',
            operator: '-',
            argument: { type: 'Literal', value: 123, raw: '123' },
            prefix: true
        });
    });

    it('Test for variables', () => {
        expect(VarStoreParser.parse('abc')).to.deep.equal({ type: 'Identifier', name: 'abc' });

        expect(VarStoreParser.parse('a.b[c[0]]')).to.deep.equal({
            type: 'MemberExpression',
            computed: true,
            object:
            {
                type: 'MemberExpression',
                computed: false,
                object: { type: 'Identifier', name: 'a' },
                property: { type: 'Identifier', name: 'b' }
            },
            property:
            {
                type: 'MemberExpression',
                computed: true,
                object: { type: 'Identifier', name: 'c' },
                property: { type: 'Literal', value: 0, raw: '0' }
            }
        });
    });

    it('Test for Function calls', () => {
        expect(VarStoreParser.parse('a b + c')).to.deep.equal({
            type: "Compound",
            body: [
                {
                    type: "Identifier",
                    name: "a"
                },
                {
                    type: "BinaryExpression",
                    operator: "+",
                    left: {
                        type: "Identifier",
                        name: "b"
                    },
                    right: {
                        type: "Identifier",
                        name: "c"
                    }
                }
            ]
        });
    });

    it('Test for Arrays', () => {
        expect(VarStoreParser.parse('[]')).to.deep.equal({ type: 'ArrayExpression', elements: [] });

        expect(VarStoreParser.parse('[a]')).to.deep.equal({
            type: 'ArrayExpression',
            elements: [{ type: 'Identifier', name: 'a' }]
        });
    });

    it('Test for operators', () => {
        expect(VarStoreParser.parse('1')).to.deep.equal({ type: 'Literal', value: 1, raw: '1' });

        expect(VarStoreParser.parse('1+2')).to.deep.equal({
            type: 'BinaryExpression',
            operator: '+',
            left: { type: 'Literal', value: 1, raw: '1' },
            right: { type: 'Literal', value: 2, raw: '2' }
        });

        expect(VarStoreParser.parse('1*2')).to.deep.equal({
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'Literal', value: 1, raw: '1' },
            right: { type: 'Literal', value: 2, raw: '2' }
        });

        expect(VarStoreParser.parse('1*(2+3)')).to.deep.equal({
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'Literal', value: 1, raw: '1' },
            right:
            {
                type: 'BinaryExpression',
                operator: '+',
                left: { type: 'Literal', value: 2, raw: '2' },
                right: { type: 'Literal', value: 3, raw: '3' }
            }
        });

        expect(VarStoreParser.parse('(1+2)*3')).to.deep.equal({
            type: 'BinaryExpression',
            operator: '*',
            left:
            {
                type: 'BinaryExpression',
                operator: '+',
                left: { type: 'Literal', value: 1, raw: '1' },
                right: { type: 'Literal', value: 2, raw: '2' }
            },
            right: { type: 'Literal', value: 3, raw: '3' }
        });

        // expect(VarStoreParser.parse('(1+2)*3+4-2-5+2/2*3')).to.deep.equal({
        //     type: 'BinaryExpression',
        //     operator: '+',
        //     left:
        //     {
        //         type: 'BinaryExpression',
        //         operator: '-',
        //         left:
        //         {
        //             type: 'BinaryExpression',
        //             operator: '-',
        //             left: [Object],
        //             right: [Object]
        //         },
        //         right: { type: 'Literal', value: 5, raw: '5' }
        //     },
        //     right:
        //     {
        //         type: 'BinaryExpression',
        //         operator: '*',
        //         left:
        //         {
        //             type: 'BinaryExpression',
        //             operator: '/',
        //             left: [Object],
        //             right: [Object]
        //         },
        //         right: { type: 'Literal', value: 3, raw: '3' }
        //     }
        // });

        // expect(VarStoreParser.parse('1 + 2-   3*	4 /8')).to.deep.equal({
        //     type: 'BinaryExpression',
        //     operator: '-',
        //     left:
        //     {
        //         type: 'BinaryExpression',
        //         operator: '+',
        //         left: { type: 'Literal', value: 1, raw: '1' },
        //         right: { type: 'Literal', value: 2, raw: '2' }
        //     },
        //     right:
        //     {
        //         type: 'BinaryExpression',
        //         operator: '/',
        //         left:
        //         {
        //             type: 'BinaryExpression',
        //             operator: '*',
        //             left: [Object],
        //             right: [Object]
        //         },
        //         right: { type: 'Literal', value: 8, raw: '8' }
        //     }
        // });

        expect(VarStoreParser.parse('\n1\r\n+\n2\n')).to.deep.equal({
            type: 'BinaryExpression',
            operator: '+',
            left: { type: 'Literal', value: 1, raw: '1' },
            right: { type: 'Literal', value: 2, raw: '2' }
        });
    });

    it('Test for custom operators', () => {

    });

    it('Test for bad numbers', () => {
        // expect(() => {VarStoreParser.parse('1.')}).to.throw('');
        // console.log(VarStoreParser.parse('1.2.3'));
    });

    it('Test for missing arguments', () => {

    });

    it('Test for Uncompleted expression-call/array', () => {

    });

    it('Test for ternary operator', () => {
        expect(VarStoreParser.parse('a ? b : c')).to.deep.equal({
            type: 'ConditionalExpression',
            test: { type: 'Identifier', name: 'a' },
            consequent: { type: 'Identifier', name: 'b' },
            alternate: { type: 'Identifier', name: 'c' }
        });


        expect(VarStoreParser.parse('a||b ? c : d')).to.deep.equal({
            type: 'ConditionalExpression',
            test:
            {
                type: 'LogicalExpression',
                operator: '||',
                left: { type: 'Identifier', name: 'a' },
                right: { type: 'Identifier', name: 'b' }
            },
            consequent: { type: 'Identifier', name: 'c' },
            alternate: { type: 'Identifier', name: 'd' }
        });
    });
});
