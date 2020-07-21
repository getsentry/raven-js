<p align="center">
  <a href="https://sentry.io" target="_blank" align="center">
    <img src="https://sentry-brand.storage.googleapis.com/sentry-logo-black.png" width="280">
  </a>
  <br />
</p>

# Official Sentry SDK for Ember.js

## Links

- [Official SDK Docs](https://docs.sentry.io/quickstart/)
- [TypeDoc](http://getsentry.github.io/sentry-javascript/)

## General

This package is an Ember addon that wraps `@sentry/browser`, with added functionality related to Ember. All methods available in
`@sentry/browser` can be imported from `@sentry/ember`.

### Installation

As with other Ember addons, run:
`ember install @sentry/ember`

Then add the following config to `config/environment.js`

```javascript
  ENV['@sentry/ember'] = {
    sentry: {
      dsn: '__DSN__' // replace __DSN__ with your DSN
    }
  };
```

### Usage

To use this SDK, call `SentryForEmber` before the application is initialized, in `app.js`. This will load Sentry config from `environment.js` for you.

```javascript
import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';
import { SentryForEmber } from '@sentry/ember';

SentryForEmber();

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}
```

### Additional Configuration

Aside from configuration passed from this addon into `@sentry/browser` via the `sentry` property, there is also the following Ember specific configuration.

```javascript
  ENV['@sentry/ember'] = {
    ignoreEmberOnErrorWarning: false, // Will silence Ember.onError warning without the need of using Ember debugging tools. False by default.
    sentry: ... // See sentry-javascript configuration https://docs.sentry.io/error-reporting/configuration/?platform=javascript
  };
```

## Testing

You can find example instrumentation in the `dummy` application, which is also used for testing. To test with the dummy
application, you must pass the dsn as an environment variable.

```javascript
SENTRY_DSN=__DSN__ ember serve
```