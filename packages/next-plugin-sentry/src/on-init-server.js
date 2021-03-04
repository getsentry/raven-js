import { init } from '@sentry/nextjs';
import { RewriteFrames } from '@sentry/integrations';
import getConfig from 'next/config';

import { getDsn, getRelease } from '../env';
import { serverConfig } from '../config';

export default async function initServer() {
  const { serverRuntimeConfig = {}, publicRuntimeConfig = {} } = getConfig() || {};
  const runtimeConfig = serverRuntimeConfig.sentry || publicRuntimeConfig.sentry || {};

  init({
    dsn: getDsn(),
    frameContextLines: 0,
    ...(getRelease() && { release: getRelease() }),
    ...runtimeConfig,
    ...serverConfig,
    integrations: [
      new RewriteFrames({
        iteratee: frame => {
          try {
            const [_, path] = frame.filename.split('.next/');
            if (path) {
              frame.filename = `app:///_next/${path}`;
            }
          } catch {}
          return frame;
        },
      }),
      ...(runtimeConfig.integrations || []),
      ...(serverConfig.integrations || []),
    ],
  });
}
