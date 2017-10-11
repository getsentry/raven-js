import { Event } from './Interface';
import { Sdk } from './Sdk';

export type Options = {
  maxBreadcrumbs: number;
};

// TODO: Add breadcrumbs
// TODO: Add context handling tags, extra, user
export class Core {
  private _sdks = new Array<Sdk.Interface>();
  /**
   * Returns all registered SDKs
   */
  get sdks() {
    this.hasConfiguredSdk();
    return this._sdks;
  }

  constructor(public dsn: string, public options: Options = { maxBreadcrumbs: 100 }) {
    // TODO: parse DSN split into public/private
    return this;
  }

  /**
   * Register a SDK client with the core
   * @param client
   * @param options
   */
  register<T extends Sdk.Interface, O extends Sdk.Options>(
    client: { new (core: Core, dsn: string, options?: O): T },
    options?: O
  ): T {
    let sdk = new client(this, this.dsn, options);
    // We use this._sdks on purpose here
    // everywhere else we should use this.sdks
    this._sdks.push(sdk);
    if (!this.hasUniqueRankedSdks()) {
      throw new TypeError('SDK must have unique rank, use options {rank: value}');
    }
    this.sortSdks();
    return sdk;
  }

  captureMessage(message: string) {
    let event = new Event();
    event.message = message;
    return this.captureEvent(event);
  }

  /**
   * Captures and sends an event. Will pass through every registered
   * SDK and send will be called by the SDK with the lowest rank
   * @param event
   */
  async captureEvent(event: Event) {
    return this.send(
      await this.sdks.reduce(
        async (event, sdk) => sdk.captureEvent(await event),
        Promise.resolve(event)
      )
    );
  }

  /**
   * Calls install() on all registered SDKs
   */
  install() {
    return Promise.all(this.sdks.map(sdk => sdk.install()));
  }

  /**
   * This will send an event with the SDK with the lowest rank
   * @param event
   */
  send(event: Event) {
    return this.sdks[0].send(event);
  }

  // -------------------- HELPER

  /**
   * This sorts all SDKs from lowest to highest rank
   */
  private sortSdks() {
    this._sdks.sort((prev, current) => {
      if (prev.options.rank < current.options.rank) return -1;
      if (prev.options.rank > current.options.rank) return 1;
      return 0;
    });
  }

  /**
   * Checks if there are multiple SDKs with the same rank
   */
  private hasUniqueRankedSdks() {
    let ranks = this.sdks.map(sdk => sdk.options.rank);
    return (
      ranks.filter(rank => ranks.indexOf(rank) === ranks.lastIndexOf(rank)).length ===
      this.sdks.length
    );
  }

  /**
   * Checks if there are any registered SDKs, this will be called by
   * this.sdks
   */
  private hasConfiguredSdk() {
    if (this._sdks.length === 0)
      throw new RangeError('At least one SDK has to be registered');
  }
}
