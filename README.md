# VarStore

The `varstore` project is an experimental JavaScript project
which was born as I experiment with writing language emulators
specifically a mix of Logo/GWBasic at this point.

`varstore` provides a scoped approach to storing variable values
and then letting you access them as you need. At maturity, `varstore`
shall support accessing child variables using `dot` notation,
working with arrays and their elements etc. I do have in mind to
implement `super` so that one can hop on to parent context when
reading values.

Let's see how far can I go.

## Usage

Let's take the following block of code:

```java
int main(String[] args) {
    int x = 10;
    System.out.println(x);
    for(int i = 0; i < 10; i++) {
        System.out.println(i, x);
        for(int j = 100; j < 110; j++) {
            System.out.println(j, i, x);
        }
    }
}
```

Say, you are writing an emulator for above pseudo-code. 
`varstore` can come in handy when writing an emulator 
for a language such as above. See annotations on right 
hand side on how to use it:

```java
int main(String[] args) {                       // const store = new VarStore('app');
    int x = 10;                                 // store.setValue('x', 10);
    System.out.println(x);                      // store.getValue('x');

    for(int i = 0; i < 10; i++) {               // store.pushContext({ i : 10});
        System.out.println(i, x);               // store.getValue('i');
                                                // store.getValue('x');

        for(int j = 100; j < 110; j++) {        // store.pushContext({ j : 100});
            System.out.println(j, i, x);        // store.getValue('j');
                                                // store.getValue('i');
                                                // store.getValue('x');

        }                                       // store.popContext(); - removes j from store

    }                                           // store.popContext(); - removes i from store

}
```

## Roadmap

* Implement `super`
* Implement variable based `array` access
* Implement `array` index operations from start/end - may be use `+3/-3` to handle

## Versioning

For transparency and insight into our release cycle, and for striving 
to maintain backward compatibility, `varstore` will be maintained under
the Semantic Versioning guidelines as much as possible.

Releases will be numbered with the follow format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backward compatibility bumps the major
* New additions without breaking backward compatibility bumps the minor
* Bug fixes and misc changes bump the patch

For more information on SemVer, please visit http://semver.org/.

## License

Apache License Version 2.0
