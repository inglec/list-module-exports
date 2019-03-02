const parseArgs = require('command-line-args');
const { readFile } = require('fs');
const { default: createLogger } = require('logging');
const { promisify } = require('util');
const { NodeVM } = require('vm2');

const { ERROR, SUCCESS } = require('./message_types');

const readFileAsync = promisify(readFile);

const logger = createLogger('list-module-exports:child');

const convertArg = (arg, isBuiltin = false) => {
  if (arg.length === 1) {
    switch (arg[0]) {
      case 'true':
        return isBuiltin ? ['*'] : true;
      case 'false':
        return false;
      default:
    }
  }

  return arg;
};

const send = (type, body) => process.send({ type, body });

function main() {
  const args = parseArgs([
    { name: 'path', type: String, defaultOption: true },
    {
      name: 'builtin',
      alias: 'b',
      type: String,
      defaultValue: false,
      multiple: true,
    },
    {
      name: 'external',
      alias: 'e',
      type: String,
      defaultValue: false,
      multiple: true,
    },
  ]);

  if (!args.path) {
    process.stderr('no filepath specified');
    process.exit(1);
  }

  const builtin = convertArg(args.builtin, true);
  const external = convertArg(args.external);

  const vm = new NodeVM({
    console: 'off',
    require: {
      builtin,
      external,
      context: 'sandbox',
    },
  });

  readFileAsync(args.path)
    .then((file) => {
      const exported = vm.run(file, args.path);
      logger.debug('Exports:', exported);

      if (typeof exported !== 'object') {
        throw Error(`"module.exports" is of type "${typeof exported}"`);
      }

      const keys = Object.keys(exported);
      send(SUCCESS, { keys });
    })
    .catch(error => send(ERROR, { error: error.message }));
}

main();
