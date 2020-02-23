import { describe, it } from 'mocha';
import { expect } from 'chai';
import VarStore from './../src/VarStore';
import VarStoreEvaluator from './../src/VarStoreEvaluator';

const store: VarStore = new VarStore('test');

store.setValue('a', 2);
store.setValue('b', 4);
store.setValue('c', 8);
store.setValue('d', 16);
store.setValue('string', 'string');
store.setValue('number', 123);
store.setValue('bool', true);
store.setValue('one', 1);
store.setValue('two', 2);
store.setValue('three', 3);
store.setValue('list', [1, 2, 3, 4, 5]);
store.setValue('isArray', Array.isArray);
store.setValue('numMap', { 10: 'ten', 3: 'three' });
store.setValue('func', function (x) { return x + 1 });
store.setValue('foo', { bar: 'baz', baz: 'wow', func: function (x) { return this[x]; } });

function assert(expr: string, store: VarStore, value: any): void {
    expect(VarStoreEvaluator.evaluate(expr, store)).to.equal(value);
}

describe('VarStoreEvaluator', () => {

    it('Basic numerical computations', () => {
        assert('a*b', store, 8);
        assert('a*b+c', store, 16);
        assert('a*b+c/16', store, 8.5);
    });

    it('Array expressions', () => {
        assert('([1,2,3])[0]', store, 1);
        assert('(["one", "two", "three"])[1]', store, 'two');
        assert('([true,false,true])[2]', store, true);
        assert('([1,true,"three"]).length', store, 3);
        assert('isArray([1,2,3])', store, true);
        assert('list[3]', store, 4);
        assert('numMap[1 + two]', store, 'three');
    });

    it('Binary expressions', () => {
        assert('1+2', store, 3);
        assert('2-1', store, 1);
        assert('2*2', store, 4);
        assert('6/3', store, 2);
        assert('5|3', store, 7);
        assert('5&3', store, 1);
        assert('5^3', store, 6);
        assert('4<<2', store, 16);
        assert('256>>4', store, 16);
        assert('-14>>>2', store, 1073741820);
        assert('10%6', store, 4);
        assert('"a"+"b"', store, 'ab');
        assert('one + three', store, 4);
    });

    it('Call expression', () => {
        assert('func(5)', store, 6);
        assert('func(1+2)', store, 4);
    });

    it('Conditional expression', () => {
        assert('(true ? "true" : "false")', store, 'true');
        assert('( ( bool || false ) ? "true" : "false")', store, 'true');
        assert('( true ? ( 123*456 ) : "false")', store, 123 * 456);
        assert('( false ? "true" : one + two )', store, 3);
    });

    it('Identifiers', () => {
        assert('string', store, 'string');
        assert('number', store, 123);
        assert('bool', store, true);
    });

    it('Literals', () => {
        assert('"foo"', store, 'foo');
        assert("'foo'", store, 'foo');
        assert('123', store, 123);
        assert('true', store, true);
    });

    it('Logical expression', () => {
        assert('true || false', store, true);
        assert('true && false', store, false);
        assert('1 == "1"', store, true);
        assert('2 != "2"', store, false);
        assert('1.234 === 1.234', store, true);
        assert('123 !== "123"', store, true);
        assert('1 < 2', store, true);
        assert('1 > 2', store, false);
        assert('2 <= 2', store, true);
        assert('1 >= 2', store, false);
    });

    it('Logical expression lazy evaluation', () => {
        assert('true || throw()', store, true);
        assert('false || true', store, true);
        assert('false && throw()', store, false);
        assert('true && false', store, false);
    });

    it('Member expression', () => {
        assert('foo.bar', store, 'baz');
        assert('foo["bar"]', store, 'baz');
        assert('foo[foo.bar]', store, 'wow');
    });

    it('Call expression with member', () => {
        assert('foo.func("bar")', store, 'baz');
    });

    it('Unary expression', () => {
        assert('-one', store, -1);
        assert('+two', store, 2);
        assert('!false', store, true);
        assert('!!true', store, true);
        assert('~15', store, -16);
        assert('+[]', store, 0);
    });

    // it('"this" expression', () => {
    //     assert('this.three', store, 3);
    // });

});
