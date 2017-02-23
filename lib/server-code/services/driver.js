'use strict';

const request = require('backendless-request');

const lang = 'JS';

const driverService = (host, port, coderunnerId) => {
  const driverQuery = requestId => ({ coderunnerId, requestId, lang });

  return {
    getRequest(requestId){
      return request.get(`http://${host}:${port}/getRequest`)
        .query(driverQuery(requestId));
    },

    sendResult(requestId, result){
      return request.post(`http://${host}:${port}/sendResult`)
        .query(driverQuery(requestId))
        .send(result);
    }
  };
};

module.exports = driverService;