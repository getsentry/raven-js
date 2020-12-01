import { Hub } from '@sentry/hub';
import { EventProcessor, Integration } from '@sentry/types';
import { dynamicRequire, fill, logger } from '@sentry/utils';

interface MysqlConnection {
  end: () => void;
  prototype: {
    query: () => void;
  };
}

/** Tracing integration for node-mysql package */
export class Mysql implements Integration {
  /**
   * @inheritDoc
   */
  public static id: string = 'Mysql';

  /**
   * @inheritDoc
   */
  public name: string = Mysql.id;

  /**
   * @inheritDoc
   */
  public setupOnce(_: (callback: EventProcessor) => void, getCurrentHub: () => Hub): void {
    let connection: MysqlConnection;

    try {
      const mysqlModule = dynamicRequire(module, 'mysql') as {
        createConnection: (options: unknown) => MysqlConnection;
      };
      const conn = mysqlModule.createConnection({});
      connection = (conn.constructor as unknown) as MysqlConnection;
      conn.end();
    } catch (e) {
      logger.error('Mysql Integration was unable to require `mysql` package.');
      return;
    }

    /**
     * function (query, callback) => void
     * function (query, params, callback) => void
     * function (query) => Promise
     * function (query, params) => Promise
     */
    fill(connection, 'query', function(orig: () => void | Promise<unknown>) {
      return function(this: unknown, options: unknown, values: unknown, callback: unknown) {
        const scope = getCurrentHub().getScope();
        const transaction = scope?.getTransaction();
        const span = transaction?.startChild({
          description: typeof options === 'string' ? options : (options as { sql: string }).sql,
          op: `query`,
        });

        if (typeof callback === 'function') {
          return orig.call(this, options, values, function(err: Error, result: unknown, fields: unknown) {
            span?.finish();
            callback(err, result, fields);
          });
        }

        if (typeof values === 'function') {
          return orig.call(this, options, function(err: Error, result: unknown, fields: unknown) {
            span?.finish();
            values(err, result, fields);
          });
        }

        return orig.call(this, options, values, callback);
      };
    });
  }
}
