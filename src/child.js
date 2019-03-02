const parseArgs = require('command-line-args');
const { readFile } = require('fs');
const { default: createLogger } = require('logging');
const { promisify } = require('util');
const { NodeVM } = require('vm2');

const { ERROR, SUCCESS } = require('./message_types');

const readFileAsync = promisify(readFile);

const logger = createLogger('list-module-exports:child');

const convertArg = (arg) => {
  if (typeof arg === 'boolean') {
    return arg;
  }

  if (Array.isArray(arg)) {
    return arg.length === 1 && typeof arg[0] === 'boolean' ? arg[0] : arg;
  }

  process.stderr(`expected type "boolean" or "array", but received "${typeof arg}"`);
  process.exit(1);

  return null;
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

  // Convert possible [ Boolean ] to Boolean.
  const builtin = convertArg(args.builtin);
  const external = convertArg(args.external);

  logger.debug('Built-in modules:', builtin);
  logger.debug('External modules:', external);

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
