import { describe, it } from 'mocha';
import { expect } from 'chai';
import VarStore from './../src/VarStore';

describe("VarStore", () => {

    it("Test negative constructor test cases", () => {
        expect(() => new VarStore(null)).to.throw();
        expect(() => new VarStore(undefined)).to.throw();
        expect(() => new VarStore('')).to.throw();
    });

    it('Test simple read/write values', () => {
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

    it("Test read/write of different data types on same variable", () => {
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

    it("Test read of arrays", () => {
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

    it("Test read for child objects", () => {
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

    it("Test read of arrays and objects together", () => {
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

    it("Test pushing and popping context", () => {
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

    it("Test forking", () => {
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

    it("Test fork/push-pop context/arrays/child objects", () => {

    });

    it("Test for write values: multiple variables", () => {
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

    it("Test for writing child object values", () => {
        const store: VarStore = new VarStore('test');

        store.setValue("emp", { empID: 9999 });
        store.setValue("emp.name.first", "hello");
        store.setValue("emp.name.last", "world");

        // store.debug();

        expect(store.getValue('emp.name.first')).to.equal("hello");
        expect(store.getValue('emp.name.last')).to.equal("world");
        expect(store.getValue('emp.empID')).to.equal(9999);
    });

    it("Test for writing values inside nested for loops", () => {
        const store: VarStore = new VarStore('test');

        for (let i = 0; i < 100; i++) {
            store.setValue('i', i);
            for (let j = 0; j < 100; j++) {
                store.setValue('j', j);
                expect(store.getValue('j')).to.equal(j);
            }

            expect(store.getValue('i')).to.equal(i);
        }
    });

    it("Test for push/pop context in recursive function call", () => {
        const store: VarStore = new VarStore('test');

        const fact = function (x: number): number {
            if (x == 1) {
                return 1;
            }
            store.setValue('x', x);
            store.pushContext();
            let value: number = x * fact(x - 1);
            store.popContext();
            expect(store.getValue('x')).to.equal(x);

            return value;
        }

        expect(fact(10)).to.equal(3628800);
    });

    // it('Test for writing nested arrayed-composed objects', () => {
    //     const store: VarStore = new VarStore('test');

    //     try {
    //         store.setValue('employees.names[0].first', 'hello');
    //         store.setValue('employees.names[1].first', 'world');
    //         store.setValue('employees.names[1].first', 'world-1');
    //         store.setValue('employees.names[0].first', 'hello-1');
    //         store.setValue('employees.names[1].first', 'world-2');
    //         store.setValue('employees.names[0].first', 'hello-2');
    //         store.setValue('employees.names[2].first', 'sangupta');
    //     } catch(e) {
    //         store.debug();
    //         throw e;
    //     }
    //     // const names = store.getValue('employees.names');
    //     // expect(Array.isArray(names)).to.true;
    //     // expect(typeof names[0]).to.equal('object');

    // });

});
