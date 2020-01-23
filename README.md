# VarStore

The `varstore` project is an experimental JavaScript project
which was born as I experiment with writing language emulators
for say Logo, GWBasic etc.

`varstore` provides a scoped approach to storing variable values
and then letting you access them as you need. At maturity, `varstore`
shall support accessing child variables using `dot` notation,
working with arrays and their elements etc. I do have in mind to
implement `super` so that one can hop on to parent context when
reading values.

Let's see how far can I go.

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
