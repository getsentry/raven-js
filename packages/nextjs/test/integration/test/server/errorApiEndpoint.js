const assert = require('assert');

const { sleep } = require('../utils/common');
const { getAsync, interceptEventRequest } = require('../utils/server');

module.exports = async ({ url: urlBase, argv }) => {
  const url = `${urlBase}/api/error`;

  const capturedRequest = interceptEventRequest(
    {
      exception: {
        values: [
          {
            type: 'Error',
            value: 'API Error',
          },
        ],
      },
      tags: {
        runtime: 'node',
      },
      request: {
        url,
        method: 'GET',
      },
      transaction: 'GET /api/error',
    },
    argv,
    'errorApiEndpoint',
  );

  await getAsync(url);
  await sleep(100);

  assert.ok(capturedRequest.isDone(), 'Did not intercept expected request');
};
