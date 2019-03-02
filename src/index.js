const { fork } = require('child_process');
const { default: createLogger } = require('logging');
const { join } = require('path');

const { ERROR, SUCCESS } = require('./message_types');

const TIMEOUT = 1000;

const logger = createLogger('list-module-exports');

const createArgs = (value, name) => {
  if (typeof value === 'boolean') {
    return [`-${name}`, value];
  }

  if (Array.isArray(value)) {
    return value.reduce((acc, arg) => {
      acc.push(`-${name}`);
      acc.push(arg);

      return acc;
    }, []);
  }

  throw Error(`expected type "boolean" or "array", but received ${typeof value}`);
};

const listModuleExports = (path, builtin = false, external = false) => {
  const builtinArgs = createArgs(builtin, 'b');
  const externalArgs = createArgs(external, 'e');
  const child = fork(join(__dirname, 'child.js'), [path, ...builtinArgs, ...externalArgs]);

  return new Promise((resolve, reject) => {
    let running = true;
    setTimeout(() => {
      if (running) {
        logger.debug(`Timed out after ${TIMEOUT}ms`);
        child.kill();
        reject(Error('timeout'));
      }
    }, TIMEOUT);

    child
      .on('message', (message) => {
        running = false;

        const { type, body } = message;
        const { keys, error: errorMessage } = body;
        const error = Error(errorMessage);

        logger.debug('Received message:', type, keys || error);

        switch (type) {
          case ERROR:
            reject(error);
            break;
          case SUCCESS:
            resolve(keys);
            break;
          default:
        }
      })
      .on('error', (error) => {
        running = false;
        logger.debug(error);
        reject(error);
      })
      .on('exit', (code, signal) => {
        running = false;

        if (code === 0) {
          resolve(signal);
        } else {
          reject(Error(`exited with code ${code} and signal ${signal}`));
        }
      });
  });
};

module.exports = listModuleExports;
