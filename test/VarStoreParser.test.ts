import { describe, it } from 'mocha';
import { expect } from 'chai';
import VarStore from './../src/VarStore';
import VarStoreParser from './../src/VarStoreParser';

describe('VarStoreParser', () => {

    it('Test for constants', () => {
        expect(VarStoreParser.parse("'abc'")).to.deep.equal({ type: 'Literal', value: 'abc', raw: "'abc'" });
        expect(VarStoreParser.parse('"abc"')).to.deep.equal({ type: 'Literal', value: 'abc', raw: '"abc"' });
        expect(VarStoreParser.parse('123')).to.deep.equal({ type: 'Literal', value: 123, raw: '123' });
        expect(VarStoreParser.parse('12.3')).to.deep.equal({ type: 'Literal', value: 12.3, raw: '12.3' });
    });

    it('Test for variables', () => {
        expect(VarStoreParser.parse('abc')).to.deep.equal({ type: 'Identifier', name: 'abc' });
    });

    it('Test for Function calls', () => {

    });

    it('Test for Arrays', () => {

    });

    it('Test for operators', () => {

    });

    it('Test for custom operators', () => {

    });

    it('Test for bad numbers', () => {

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
