const parseArgs = require('command-line-args');
const { readFile } = require('fs');
const { promisify } = require('util');
const { NodeVM } = require('vm2');

const { ERROR, SUCCESS } = require('./message_types');

const readFileAsync = promisify(readFile);

const createVM = (builtin = false, external = false) => (
  new NodeVM({
    console: 'off',
    require: {
      builtin,
      external,
      context: 'sandbox',
    },
  })
);

const send = (type, body) => process.send({ type, body });

function main() {
  const args = parseArgs([
    { name: 'path', type: String, defaultOption: true },
    {
      name: 'builtin',
      alias: 'b',
      type: String,
      multiple: true,
    },
    {
      name: 'external',
      alias: 'e',
      type: String,
      multiple: true,
    },
  ]);

  if (!args.path) {
    process.stderr('no filepath specified');
    process.exit(1);
  }

  const vm = createVM(args.builtin, args.external);

  readFileAsync(args.path)
    .then((file) => {
      const exported = vm.run(file, args.path);

      if (typeof exported !== 'object') {
        return Promise.reject(Error(`"module.exports" is of type "${typeof exported}"`));
      }

      const keys = Object.keys(exported);
      send(SUCCESS, keys);

      return Promise.resolve();
    })
    .catch(error => send(ERROR, error.message));
}

main();
