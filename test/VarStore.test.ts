import { describe, it } from 'mocha';
import { expect } from 'chai';
import VarStore from './../src/VarStore';

describe("VarStore", () => {

    it("Check negative test cases", () => {
        expect(() => new VarStore(null)).to.throw();
        expect(() => new VarStore(undefined)).to.throw();
        expect(() => new VarStore('')).to.throw();
    })

    it('Create a simple varstore and read/write values', () => {
        const store: VarStore = new VarStore('test');

        store.setValue('firstName', 'hello');
        expect(store.getValue('firstName')).to.equal('hello');

        store.setValue('lastName', 'world');
        expect(store.getValue('firstName')).to.equal('hello');
        expect(store.getValue('lastName')).to.equal('world');

        store.setValue('firstName', 'hey');
        expect(store.getValue('firstName')).to.equal('hey');
        expect(store.getValue('lastName')).to.equal('world');
    });

    it("Check for various data types including null/undefined", () => {
        const store: VarStore = new VarStore('test');

        store.setValue('name', undefined);
        expect(store.getValue('name')).to.be.undefined;

        store.setValue('name', null);
        expect(store.getValue('name')).to.be.null;

        store.setValue('name', 34);
        expect(store.getValue('name')).to.equal(34);

        store.setValue('name', 44.444);
        expect(store.getValue('name')).to.equal(44.444);

        store.setValue('name', { age: 21 });
        expect(store.getValue('name')).to.be.eql({ age: 21 });
    });

    it("Child object tests", () => {
        const store: VarStore = new VarStore('test');

        const employee = {
            name : {
                username : 'sangupta',
                firstName : 'Sandeep',
                lastName : 'Gupta'
            },
            year : 2020,
            address : {
                web : {
                    url : 'sangupta.com'
                }
            }
        }

        store.setValue('employee', employee);
        expect(store.getValue('employee.name.username')).to.equal('sangupta');
        expect(store.getValue('employee.address.web.url')).to.equal('sangupta.com');
    });

});
