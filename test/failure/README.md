# List Module Exports

This package safely evaluates a Node script in a sandbox and returns the keys of its `module.exports`.
It is resistant to syntax errors and infinite loops.

## Installation

``` bash
npm install --save https://github.com/inglec/list-module-exports
```

``` js
const listModuleExports = require('list-module-exports');
```

## Usage

``` js
listModuleExports(path.join(__dirname, 'index.js'), ['fs'], true)
  .then(list => console.log(list))
  .catch(error => console.error(error));
```

### listModuleExports(path[, internal][, external])

Arguments:

| Name       | Type              | Default | Description                            |
| ---------- | ----------------- | ------- | -------------------------------------- |
| `path`     | `String`          |         | Path to file                           |
| `builtin`  | `Array`/`Boolean` | `false` | Array of allowed internal Node modules |
| `external` | `Array`/`Boolean` | `false` | Array of allowed NPM modules           |

Returns: `Promise`
* `resolves`: `Array<String>`
* `rejects`: `Error`
