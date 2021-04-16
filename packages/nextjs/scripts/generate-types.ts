/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Generate `@sentry/nextjs` types.
 *
 * This file (compiles to) a script which generates a merged set of exports for the nextjs SDK, for the ultimate purpose
 * of generating the SDK's types. The `module` and `browser` entries in `package.json` allow different files to serve as
 * the SDK's entry point depending on environment, but there is no such bifurcation when it comes to types. Leaving the
 * `types` entry out causes TypeScript to search for a declaration file whose name matches each of `module` and
 * `browser` values, respectively, and that allows compilation to happen (yay!) but without either `types` or `main`
 * entries in `package.json`, VSCode is unable to resolve the SDK for code completion, Intellisense, etc. (boo!). The
 * `types` entry can't be an array, but even if it could, that wouldn't handle the case of namespace clashes
 * (`@sentry/node.Integrations` is not the same as `@sentry/react.Integrations`, for instance - which one wins?). So
 * there needs to be a single source of truth, generated by semi-intelligently merging the exports from the two packages
 * (by way of the two different, environment-specific index files), such that types can then be generated from that
 * single file.
 *
 * Known limitations:
 *
 *  - In a small handful of mostly-non-user-relevant spots, there's no easy way to resolve the conflict (for example,
 *    which `flush` and `close` methods should be exported, node's or react's?) and so those types have been omitted
 *    from this file. The correct methods are stil exported in their respective environments - the JS works, in other
 *    words - but they won't appear in the types. The one exception to this is the `init` method, because it's too
 *    important to leave out. For the moment, it's using the node version as the type in both environments. (TODO: Make
 *    a generic version of `init`, and possibly the other clashes, just for use in types.)
 *
 * The file that this script's compiled version generates is `/src/types.ts`.
 */

// TODO - should we be importing from the two index files instead?

import * as nodeSDK from '@sentry/node';
import * as reactSDK from '@sentry/react';
import { isPlainObject } from '@sentry/utils';
import * as fs from 'fs';
import * as prettier from 'prettier';

type PlainObject = { [key: string]: any };

// eslint-disable-next-line no-console
console.log('Generating `types.ts`...');

/** Create the merged set of exports, also merging any array- or object-type exports */

// TODO - combine these (only store values for collections?)
const mergedExports: PlainObject = {};
const mergedExportsWithSources: Array<{
  exportName: string;
  source: string;
  // elementSources?: Array<{ elementName: string; source: string }>;
  elementSources?: { node: string[]; react: string[] };
}> = [];

const allExportNames = new Set([...Object.keys(nodeSDK), ...Object.keys(reactSDK)]);

allExportNames.forEach(exportName => {
  const nodeExport = (nodeSDK as PlainObject)[exportName];
  const reactExport = (reactSDK as PlainObject)[exportName];

  // First, the easy stuff - things that only appear in one or the other package.
  if (nodeExport && !reactExport) {
    mergedExports[exportName] = nodeExport;
    mergedExportsWithSources.push({ exportName, source: "'@sentry/node'" });
    return;
  }

  if (reactExport && !nodeExport) {
    mergedExports[exportName] = reactExport;
    mergedExportsWithSources.push({ exportName, source: "'@sentry/react'" });
    return;
  }

  // If we've gotten this far, it means that both packages export something named `name`. In some cases, that's because
  // they're literally exporting the same thing (a type imported from `@sentry/types`, for example). If so, there's no
  // actual clash, so just copy over node's copy since it's equal to react's copy.
  if (nodeExport === reactExport) {
    mergedExports[exportName] = nodeExport;
    mergedExportsWithSources.push({ exportName, source: "'@sentry/node'" });
    return;
  }

  // At this point, the only option left is that there actually is a name clash (i.e., each package exports something
  // named `name`, but not the same something). The only place where this can be solved in a sensible manner is in the
  // case of collections, which we can merge the same way we're merging the overall modules. Fortunately, with the
  // exception of `init`, the spots where this happens are technically exported/public but not something 99% of users
  // will touch, so it feels safe for now to leave them out of the types.(TODO: Is there *any* way to inject the correct
  // values for each environment?)

  // In theory there are other collections besides objects and arrays, but thankfully we don't have any in this case.
  if (!Array.isArray(nodeExport) && !isPlainObject(nodeExport)) {
    // can't leave this out, so use the node version for now
    if (exportName === 'init') {
      mergedExports[exportName] = nodeExport;
      mergedExportsWithSources.push({ exportName, source: "'@sentry/node'" });
    }
    // otherwise, bail
    return;
  }

  // If we're dealing with an array, convert to an object for the moment, keyed by element name, so that individual
  // elements are easier to find. (Yes, this assumes that every element *has* a `name` property, but luckily in our case
  // that's true.)
  let nodeCollection: PlainObject, reactCollection: PlainObject;
  if (Array.isArray(nodeExport) && Array.isArray(reactExport)) {
    nodeCollection = {};
    nodeExport.forEach((element: { name: string }) => (nodeCollection[element.name] = element));

    reactCollection = {};
    reactExport.forEach((element: { name: string }) => {
      reactCollection[element.name] = element;
    });
  }
  // Otherwise, just use the object as is
  else {
    nodeCollection = nodeExport;
    reactCollection = reactExport;
  }

  // And now we do it all again, in miniature
  const allCollectionNames = new Set([...Object.keys(nodeCollection), ...Object.keys(reactCollection)]);
  const mergedCollection: PlainObject = {};
  const mergedCollectionBySource: {
    node: string[];
    react: string[];
  } = { node: [], react: [] };
  // const mergedCollectionWithSources: Array<{
  //   elementName: string;
  //   source: string;
  // }> = [];

  allCollectionNames.forEach(elementName => {
    const nodeCollectionElement = nodeCollection[elementName];
    const reactCollectionElement = reactCollection[elementName];

    // grab everything that's only in node...
    if (nodeCollectionElement && !reactCollectionElement) {
      mergedCollection[elementName] = nodeCollectionElement;
      mergedCollectionBySource.node.push(elementName);
      // mergedCollectionWithSources.push({ elementName, source: 'nodeSDK' });
      return;
    }

    // ... and everything that's only in react
    if (reactCollectionElement && !nodeCollectionElement) {
      mergedCollection[elementName] = reactCollectionElement;
      mergedCollectionBySource.react.push(elementName);
      // mergedCollectionWithSources.push({ elementName, source: 'reactSDK' });
      return;
    }

    // now grab all the ones which are actually just pointers to the same thing
    if (
      nodeCollectionElement === reactCollectionElement ||
      // this will be true if we're dealing with instances instead of a classes
      (Object.getPrototypeOf(nodeCollectionElement).constructor?.name === nodeCollectionElement.constructor?.name &&
        // and then this ensures they're the samre class
        Object.getPrototypeOf(nodeCollectionElement) === Object.getPrototypeOf(reactCollectionElement))
    ) {
      mergedCollection[elementName] = nodeCollectionElement;
      mergedCollectionBySource.node.push(elementName);
      // mergedCollectionWithSources.push({ elementName, source: 'nodeSDK' });
      return;
    }

    // at this point, in a general case, we'd recurse, but we're assuming type match and we know we don't have any
    // nested collections, so we're done with this pair of collection elements
  });

  // having merged the two collections, if we started with an array, convert back to one
  if (Array.isArray(nodeExport)) {
    mergedExports[exportName] = Object.values(mergedCollection);
    mergedExportsWithSources.push({ exportName, source: 'array', elementSources: mergedCollectionBySource }); // TODO have to build the collection as a string
  }
  // otherwise, just use the merged object
  else {
    mergedExports[exportName] = mergedCollection;
    mergedExportsWithSources.push({ exportName, source: 'object', elementSources: mergedCollectionBySource });
  }
});

/** Convert the data into lines of export code and write it to disk */

// This is here as a real comment (rather than an array of strings) because it's easier to edit that way if we ever need
// to. (TODO: Convert to a string per line automatically)
/**
 * THIS IS AN AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
 *
 * More detail can be found in the script that (compiles to the script that) generated this file,
 * `/scripts/generate-types.ts`.
 */

const outputLines = [
  '/* eslint-disable @typescript-eslint/no-explicit-any */',
  '',
  '/**',
  ' * THIS IS AN AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.',
  ' *',
  ' * More detail can be found in the script that (compiles to the script that) generated this file,',
  ' * `/scripts/generate-types.ts`.',
  ' */',
  '',
  "import * as nodeSDK from '@sentry/node'",
  "import * as reactSDK from '@sentry/react'",
  '',
  "export const SDK_NAME = 'sentry.javascript.nextjs';",
];
const basicExportLines = ['', '// Basic exports', ''];
const collectionExportLines = ['', `// Merged arrays and objects`, ''];

mergedExportsWithSources.forEach(element => {
  const { exportName, source, elementSources } = element;

  if (source === "'@sentry/node'" || source === "'@sentry/react'") {
    basicExportLines.push(`export { ${exportName} } from ${source};`);
    return;
  }

  if (source === 'array' || source === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { node: nodeElementNames, react: reactElementNames } = elementSources!;

    const titleCaseExportName = exportName.replace(exportName[0], exportName[0].toUpperCase());
    const nodeExportName = `node${titleCaseExportName}`;
    const reactExportName = `react${titleCaseExportName}`;
    collectionExportLines.push(
      `// ${exportName}`,
      '',
      `const ${nodeExportName}Names = ${JSON.stringify(nodeElementNames)}`,
      `const ${reactExportName}Names = ${JSON.stringify(reactElementNames)}`,
    );

    if (source === 'array') {
      collectionExportLines.push(
        `const ${nodeExportName} = nodeSDK.${exportName}.filter(`,
        `  element => element.name in ${nodeExportName}Names`,
        `)`,
        `const ${reactExportName} = reactSDK.${exportName}.filter(`,
        `  element => element.name in ${reactExportName}Names`,
        `)`,
        `export const ${exportName} = [ ...${nodeExportName}, ...${reactExportName} ]`,
        '',
      );
      return;
    }
    // must be an object
    else {
      collectionExportLines.push(
        `const ${nodeExportName} = { } as { [key: string]: any };`,
        `const ${reactExportName} = { } as { [key: string]: any };`,
        `${nodeExportName}Names.forEach(elementName => { `,
        `  ${nodeExportName}[elementName] = nodeSDK.${exportName}[elementName as keyof typeof nodeSDK.${exportName}]`,
        `});`,
        `${reactExportName}Names.forEach(elementName => { `,
        `  ${reactExportName}[elementName] = reactSDK.${exportName}[elementName as keyof typeof reactSDK.${exportName}]`,
        `});`,
        `export const ${exportName} = { ...${nodeExportName}, ...${reactExportName} }`,
        '',
      );
      return;
    }
  }
});

outputLines.push(...basicExportLines, ...collectionExportLines);
const rawOutput = `${outputLines.join('\n')}`;

prettier
  .resolveConfigFile()
  .then(configFilepath => prettier.resolveConfig(configFilepath as string))
  .then(options => prettier.format(rawOutput, { ...options, parser: 'typescript' } as prettier.Options))
  .then(finalOutput =>
    fs.writeFile('./src/types.ts', finalOutput, () => {
      // eslint-disable-next-line no-console
      console.log('Done writing file.');
    }),
  )
  .catch(err => {
    // eslint-disable-next-line no-console
    console.log(`Error formatting types file: ${err}`);
  });
