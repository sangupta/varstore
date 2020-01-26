import { describe, it } from 'mocha';
import { expect } from 'chai';
import VarStore from './../src/VarStore';

describe("VarStore", () => {

    it("Check negative test cases", () => {
        expect(() => new VarStore(null)).to.throw();
        expect(() => new VarStore(undefined)).to.throw();
        expect(() => new VarStore('')).to.throw();
    });

    it('Check for simple varstore and read/write values', () => {
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

        store.setValue('name', true);
        expect(store.getValue('name')).to.be.true;


        store.setValue('name', false);
        expect(store.getValue('name')).to.be.false;
    });

    it("Check for arrays", () => {
        const store: VarStore = new VarStore('test');
        const array: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        store.setValue('array', array);
        expect(store.getValue('array')).to.eql(array);

        expect(store.getValue('array[0]')).to.eql(1);
        expect(store.getValue('array[1]')).to.eql(2);
        expect(store.getValue('array[2]')).to.eql(3);
        expect(store.getValue('array[3]')).to.eql(4);
        expect(store.getValue('array[4]')).to.eql(5);
        expect(store.getValue('array[5]')).to.eql(6);
        expect(store.getValue('array[6]')).to.eql(7);
        expect(store.getValue('array[7]')).to.eql(8);
        expect(store.getValue('array[8]')).to.eql(9);
        expect(store.getValue('array[9]')).to.eql(10);

    });

    it("Child object tests", () => {
        const store: VarStore = new VarStore('test');

        const employee = {
            name: {
                username: 'sangupta',
                firstName: 'Sandeep',
                lastName: 'Gupta'
            },
            year: 2020,
            address: {
                web: {
                    url: 'sangupta.com'
                }
            }
        }

        store.setValue('employee', employee);
        expect(store.getValue('employee.name.username')).to.equal('sangupta');
        expect(store.getValue('employee.address.web.url')).to.equal('sangupta.com');
    });

    it("Check arrays and objects together", () => {
        const store: VarStore = new VarStore('test');
        const data = {
            type: "employees",
            employees: [
                {
                    id: "emp1",
                    name: {
                        first: "hello",
                        second: "world"
                    }
                },
                {
                    id: "emp2",
                    name: {
                        first: "tom",
                        last: "jerry"
                    }
                },
                {
                    id: "emp3",
                    name: {
                        first: "mickey",
                        last: "mouse"
                    }
                }
            ]
        };

        store.setValue("data", data);
        expect(store.getValue('data.employees[0].name.first')).to.equal('hello');
        expect(store.getValue('data.employees[1].name.first')).to.equal('tom');
        expect(store.getValue('data.employees[2].name.first')).to.equal('mickey');
    });

    it("Check pushing and popping context", () => {
        const store: VarStore = new VarStore('test');
        store.setValue('name', 'first');

        expect(store.getValue('name')).to.equal('first');

        // push context
        store.pushContext({ name: 'second' });
        expect(store.getValue('name')).to.equal('second');

        // push again
        store.pushContext({ name: 'third' });
        expect(store.getValue('name')).to.equal('third');

        // pop
        store.popContext();
        expect(store.getValue('name')).to.equal('second');

        // push one more
        store.pushContext({ name: 'fourth' });
        expect(store.getValue('name')).to.equal('fourth');

        // pop
        store.popContext();
        expect(store.getValue('name')).to.equal('second');

        // pop
        store.popContext();
        expect(store.getValue('name')).to.equal('first');
    });

    it("Check forking", () => {
        const store: VarStore = new VarStore('test');
        const employee = {
            name: {
                username: 'sangupta',
                firstName: 'Sandeep',
                lastName: 'Gupta'
            }
        };

        store.setValue('employee', employee);
        expect(store.getValue('employee.name.username')).to.equal('sangupta');

        // just fork and test
        const forked: VarStore = store.fork('forked');

        expect(forked.getValue('employee.name.username')).to.equal('sangupta');
        expect(store.getValue('employee.name.username')).to.equal('sangupta');

        // add to fork
        const employee2 = {
            name: {
                username: 'helloworld',
                firstName: 'Hello',
                lastName: 'World'
            }
        };
        forked.setValue('employee', employee2);
        expect(forked.getValue('employee.name.username')).to.equal('helloworld');
        expect(store.getValue('employee.name.username')).to.equal('sangupta');
    });

    it("Check fork/push-pop context/arrays/child objects", () => {

    });

    it("Check for set/get value: basic props", () => {
        const store: VarStore = new VarStore('test');

        store.setValue("name", "hello world");
        store.setValue("empID", 9999);
        store.setValue("employed", true);
        store.setValue("retired", false);

        expect(store.getValue('name')).to.equal('hello world');
        expect(store.getValue('empID')).to.equal(9999);
        expect(store.getValue('employed')).to.true;
        expect(store.getValue('retired')).to.false;
    });

    it("Check for set/get value: child", () => {
        const store: VarStore = new VarStore('test');

        store.setValue("emp", { empID: 9999 });
        store.setValue("emp.name.first", "hello");
        store.setValue("emp.name.last", "world");

        expect(store.getValue('emp.name.first')).to.equal("hello");
        expect(store.getValue('emp.name.last')).to.equal("world");
        expect(store.getValue('emp.empID')).to.equal(9999);
    })
});
