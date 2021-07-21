import { StackFrame } from '@sentry/types';
import * as fs from 'fs';

import { ContextLines, resetFileContentCache } from '../src/integrations/contextlines';
import * as Parsers from '../src/parsers';
import * as stacktrace from '../src/stacktrace';
import { getError } from './helper/error';

describe('parsers.ts', () => {
  let frames: stacktrace.StackFrame[];
  let spy: jest.SpyInstance;
  let contextLines: ContextLines;

  function addContext(frames: StackFrame[]) {
    contextLines.process({ exception: { values: [{ stacktrace: { frames } }] } });
  }

  beforeEach(() => {
    spy = jest.spyOn(fs, 'readFileSync');
    frames = stacktrace.parse(new Error('test'));
    contextLines = new ContextLines();
    resetFileContentCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('lru file cache', () => {
    test('parseStack with same file', () => {
      expect.assertions(1);

      let mockCalls = 0;
      let parsedFrames = Parsers.parseStack(frames);
      addContext(parsedFrames);

      mockCalls = spy.mock.calls.length;
      parsedFrames = Parsers.parseStack(frames);
      addContext(parsedFrames);

      // Calls to readFile shouldn't increase if there isn't a new error
      expect(spy).toHaveBeenCalledTimes(mockCalls);
    });

    test('parseStack with ESM module names', () => {
      expect.assertions(1);

      const framesWithFilePath: stacktrace.StackFrame[] = [
        {
          columnNumber: 1,
          fileName: 'file:///var/task/index.js',
          functionName: 'module.exports../src/index.ts.fxn1',
          lineNumber: 1,
          methodName: 'fxn1',
          native: false,
          typeName: 'module.exports../src/index.ts',
        },
      ];
      const parsedFrames = Parsers.parseStack(framesWithFilePath);
      addContext(parsedFrames);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('parseStack with adding different file', () => {
      expect.assertions(2);
      let mockCalls = 0;
      let newErrorCalls = 0;
      let parsedFrames = Parsers.parseStack(frames);
      addContext(parsedFrames);

      mockCalls = spy.mock.calls.length;
      parsedFrames = Parsers.parseStack(stacktrace.parse(getError()));
      addContext(parsedFrames);

      newErrorCalls = spy.mock.calls.length;
      expect(newErrorCalls).toBeGreaterThan(mockCalls);

      parsedFrames = Parsers.parseStack(stacktrace.parse(getError()));
      addContext(parsedFrames);

      expect(spy).toHaveBeenCalledTimes(newErrorCalls);
    });

    test('parseStack with duplicate files', () => {
      expect.assertions(1);
      const framesWithDuplicateFiles: stacktrace.StackFrame[] = [
        {
          columnNumber: 1,
          fileName: '/var/task/index.js',
          functionName: 'module.exports../src/index.ts.fxn1',
          lineNumber: 1,
          methodName: 'fxn1',
          native: false,
          typeName: 'module.exports../src/index.ts',
        },
        {
          columnNumber: 2,
          fileName: '/var/task/index.js',
          functionName: 'module.exports../src/index.ts.fxn2',
          lineNumber: 2,
          methodName: 'fxn2',
          native: false,
          typeName: 'module.exports../src/index.ts',
        },
        {
          columnNumber: 3,
          fileName: '/var/task/index.js',
          functionName: 'module.exports../src/index.ts.fxn3',
          lineNumber: 3,
          methodName: 'fxn3',
          native: false,
          typeName: 'module.exports../src/index.ts',
        },
      ];

      const parsedFrames = Parsers.parseStack(framesWithDuplicateFiles);
      addContext(parsedFrames);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('parseStack with no context', () => {
      contextLines = new ContextLines({ frameContextLines: 0 });

      expect.assertions(1);
      const parsedFrames = Parsers.parseStack(frames);
      addContext(parsedFrames);
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });
});
