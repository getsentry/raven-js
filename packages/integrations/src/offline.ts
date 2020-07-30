import { captureEvent } from '@sentry/minimal';
import { Event, EventProcessor, Hub, Integration } from '@sentry/types';
import { getGlobalObject, logger, uuid4 } from '@sentry/utils';
// @ts-ignore
import localforage = require('localforage');

/**
 * cache offline errors and send when connected
 */
export class Offline implements Integration {
  // tslint:disable: no-unsafe-any

  /**
   * @inheritDoc
   */
  public static id: string = 'Offline';

  /**
   * @inheritDoc
   */
  public readonly name: string = Offline.id;

  /**
   * event cache
   */
  public offlineEventStore: any;

  /**
   * @inheritDoc
   */
  public constructor() {
    this.offlineEventStore = localforage.createInstance({
      name: 'sentry/offlineEventStore',
    });

    getGlobalObject<Window>().addEventListener('online', () => {
      this._sendEvents().catch(() => {
        logger.warn('could not send cached events');
      });
    });
  }

  /**
   * @inheritDoc
   */
  public setupOnce(addGlobalEventProcessor: (callback: EventProcessor) => void, getCurrentHub: () => Hub): void {
    addGlobalEventProcessor(async (event: Event) => {
      if (getCurrentHub().getIntegration(Offline)) {
        const global = getGlobalObject<Window>();

        // cache if we are positively offline
        if ('navigator' in global && 'onLine' in global.navigator && !global.navigator.onLine) {
          try {
            await this._cacheEvent(event);
          } catch (_error) {
            logger.warn('could not cache event while offline');
          }

          // return null on success or failure, because being offline will still result in an error
          return null;
        }
      }

      return event;
    });
  }

  /**
   * cache an event to send later
   * @param event an event
   */
  private async _cacheEvent(event: Event): Promise<Event> {
    return this.offlineEventStore.setItem(uuid4(), event);
  }

  /**
   * purge event from cache
   */
  private async _purgeEvent(cacheKey: string): Promise<void> {
    return this.offlineEventStore.removeItem(cacheKey);
  }

  /**
   * send all events
   */
  private async _sendEvents(): Promise<void> {
    return this.offlineEventStore.iterate((event: any, cacheKey: string, _index: number): void => {
      try {
        const newEventId = captureEvent(event);

        if (newEventId) {
          this._purgeEvent(cacheKey)
            .then(_ => _)
            .catch(_ => _);
        }
      } catch (_error) {
        logger.warn('could not send cached event');
      }
    });
  }
}
