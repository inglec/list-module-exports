const { fork } = require('child_process');
const { join } = require('path');

const { ERROR, SUCCESS } = require('./message_types');

const createArgs = (array, name) => (
  array.reduce((acc, arg) => {
    acc.push(`-${name}`);
    acc.push(arg);

    return acc;
  }, [])
);

const listModuleExports = (path, builtin = [], external = []) => {
  const builtinArgs = createArgs(builtin, 'b');
  const externalArgs = createArgs(external, 'e');
  const child = fork(join(__dirname, 'child.js'), [path, ...builtinArgs, ...externalArgs]);

  return new Promise((resolve, reject) => {
    let running = true;
    setTimeout(() => {
      if (running) {
        child.kill();
        reject(Error('timeout'));
      }
    }, 1000);

    child
      .on('message', (message) => {
        running = false;

        switch (message.type) {
          case ERROR:
            reject(Error(message.body));
            break;
          case SUCCESS:
            resolve(message.body);
            break;
          default:
        }
      })
      .on('error', (error) => {
        running = false;
        reject(error);
      })
      .on('exit', () => {
        running = false;
      });
  });
};

module.exports = listModuleExports;
