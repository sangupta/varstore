import { describe, it } from 'mocha';
import { expect } from 'chai';
import VarStore from './../src/VarStore';
import VarStoreEvaluator from './../src/VarStoreEvaluator';

describe('VarStoreEvaluator', () => {

    it('Basic numerical computations', () => {
        let store: VarStore = new VarStore('test');
        store.setValue('a', 2);
        store.setValue('b', 4);
        store.setValue('c', 8);
        store.setValue('d', 16);

        expect(VarStoreEvaluator.evaluate('a*b', store)).to.equal(8);
        expect(VarStoreEvaluator.evaluate('a*b+c', store)).to.equal(16);
        expect(VarStoreEvaluator.evaluate('a*b+c/16', store)).to.equal(8.5);
    });

});
