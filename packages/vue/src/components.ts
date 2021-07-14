import { ViewModel } from './types';

// Based on https://github.com/vuejs/vue/blob/master/src/core/util/debug.js

const classifyRE = /(?:^|[-_])(\w)/g;
const classify = (str: string): string => str.replace(classifyRE, c => c.toUpperCase()).replace(/[-_]/g, '');

const repeat = (str: string, n: number): string => {
  let res = '';
  while (n) {
    if (n % 2 === 1) {
      res += str;
    }
    if (n > 1) {
      str += str; // eslint-disable-line no-param-reassign
    }
    n >>= 1; // eslint-disable-line no-bitwise, no-param-reassign
  }
  return res;
};

export const formatComponentName = (vm?: ViewModel, includeFile?: boolean): string => {
  if (!vm) {
    return '<Anonymous>';
  }

  if (vm.$root === vm) {
    return '<Root>';
  }

  const options = vm.$options;

  let name = options.name || options._componentTag;
  const file = options.__file;
  if (!name && file) {
    const match = file.match(/([^/\\]+)\.vue$/);
    if (match) {
      name = match[1];
    }
  }

  return (name ? `<${classify(name)}>` : `<Anonymous>`) + (file && includeFile !== false ? ` at ${file}` : ``);
};

export const generateComponentTrace = (vm?: ViewModel): string => {
  if (vm?._isVue && vm?.$parent) {
    const tree = [];
    let currentRecursiveSequence = 0;
    while (vm) {
      if (tree.length > 0) {
        const last = tree[tree.length - 1] as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (last.constructor === vm.constructor) {
          currentRecursiveSequence += 1;
          vm = vm.$parent; // eslint-disable-line no-param-reassign
          continue;
        } else if (currentRecursiveSequence > 0) {
          tree[tree.length - 1] = [last, currentRecursiveSequence];
          currentRecursiveSequence = 0;
        }
      }
      tree.push(vm);
      vm = vm.$parent; // eslint-disable-line no-param-reassign
    }

    const formattedTree = tree
      .map(
        (vm, i) =>
          `${(i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) +
            (Array.isArray(vm)
              ? `${formatComponentName(vm[0])}... (${vm[1]} recursive calls)`
              : formatComponentName(vm))}`,
      )
      .join('\n');

    return `\n\nfound in\n\n${formattedTree}`;
  }

  return `\n\n(found in ${formatComponentName(vm)})`;
};