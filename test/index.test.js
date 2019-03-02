const path = require('path');

const listModuleExports = require('../src/index');

const failurePath = path.join(process.env.NODE_PATH, 'test/failure');
const successPath = path.join(process.env.NODE_PATH, 'test/success');

describe('listModuleExports', () => {
  test('succeeds exporting object', () => {
    const filepath = path.join(successPath, 'object.js');

    return expect(listModuleExports(filepath))
      .resolves
      .toEqual(expect.arrayContaining(['key1', 'key2']));
  });

  test('succeeds exporting array of whitelisted internal modules', () => {
    const filepath = path.join(successPath, 'require_internal.js');
    const builtin = ['fs', 'path'];

    return expect(listModuleExports(filepath, builtin))
      .resolves
      .toEqual(expect.arrayContaining(builtin));
  });

  test('succeeds exporting all internal modules', () => {
    const filepath = path.join(successPath, 'require_internal.js');
    const builtin = ['fs', 'path'];

    return expect(listModuleExports(filepath, true))
      .resolves
      .toEqual(expect.arrayContaining(builtin));
  });

  test('succeeds exporting with no "module.exports" defined', () => {
    const filepath = path.join(successPath, 'no_exports.js');

    return expect(listModuleExports(filepath))
      .resolves
      .toEqual(expect.arrayContaining([]));
  });

  test('fails exporting internal module', () => {
    const filepath = path.join(failurePath, 'require_internal.js');

    return expect(listModuleExports(filepath, ['fs']))
      .rejects
      .toThrow('Access denied to require ');
  });

  test('fails exporting function', () => {
    const filepath = path.join(failurePath, 'export_function.js');

    return expect(listModuleExports(filepath))
      .rejects
      .toThrow('"module.exports" is of type "function"');
  });

  test('fails exporting string', () => {
    const filepath = path.join(failurePath, 'export_string.js');

    return expect(listModuleExports(filepath))
      .rejects
      .toThrow('"module.exports" is of type "string"');
  });

  test('fails running infinite loop', () => {
    const filepath = path.join(failurePath, 'infinite_loop.js');

    return expect(listModuleExports(filepath))
      .rejects
      .toThrow('timeout');
  });

  test('fails on syntax error', () => {
    const filepath = path.join(failurePath, 'syntax_error.js');

    return expect(listModuleExports(filepath))
      .rejects
      .toThrow();
  });
});
