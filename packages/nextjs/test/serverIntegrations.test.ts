import { RewriteFrames } from '@sentry/integrations';
import { Integration } from '@sentry/types';

import { defaultRewriteFrames, getFinalServerIntegrations, IntegrationFunction } from '../src/utils/serverIntegrations';

describe('user integrations without RewriteFrames', () => {
  test('as an array', () => {
    const userIntegrations: Integration[] = [];
    // Should get a single integration: RewriteFrames
    let finalIntegrations = getFinalServerIntegrations(userIntegrations);
    expect(Array.isArray(finalIntegrations)).toBeTruthy();
    finalIntegrations = finalIntegrations as Integration[];
    expect(finalIntegrations.length === 1).toBeTruthy();
    expect(finalIntegrations[0]).toMatchObject(defaultRewriteFrames);
  });

  test('as a function', () => {
    const userIntegrationFnc: IntegrationFunction = (): Integration[] => {
      return [];
    };
    // Should get a single integration: RewriteFrames
    const integrationWrapper = getFinalServerIntegrations(userIntegrationFnc);
    expect(typeof integrationWrapper === 'function').toBeTruthy();
    const finalIntegrations = (integrationWrapper as IntegrationFunction)([]);
    expect(finalIntegrations.length === 1).toBeTruthy();
    expect(finalIntegrations[0]).toMatchObject(defaultRewriteFrames);
  });
});

describe('user integrations with RewriteFrames', () => {
  test('as an array', () => {
    const rewriteFramesIntegration = new RewriteFrames();
    const userIntegrations = [rewriteFramesIntegration];
    // Should get the same array (with no patches)
    const finalIntegrations = getFinalServerIntegrations(userIntegrations);
    expect(finalIntegrations).toMatchObject(userIntegrations);
  });

  test('as a function', () => {
    const userIntegrations = [new RewriteFrames()];
    const integrationsFnc: IntegrationFunction = (_integrations: Integration[]): Integration[] => {
      return userIntegrations;
    };
    // Should get a function that returns the RewriteFramesIntegration
    let finalIntegrations = getFinalServerIntegrations(integrationsFnc);
    expect(typeof finalIntegrations === 'function').toBeTruthy();
    finalIntegrations = finalIntegrations as IntegrationFunction;
    expect(finalIntegrations([])).toMatchObject(userIntegrations);
  });
});
