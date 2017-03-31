'use strict';

const request = require('backendless-request');

const lang = 'JS';

const driverService = (host, port, coderunnerId) => {

  const driverQuery = (requestId, channelResposeId) =>
    ({ coderunnerId, requestId, lang, channelResposeId });

  return {
    getRequest(requestId){
      return request.get(`http://${host}:${port}/getRequest`)
        .query(driverQuery(requestId));
    },

    sendResult(requestId, responseChannelId, result){
      return request.post(`http://${host}:${port}/sendResult`)
        .query(driverQuery(requestId, responseChannelId))
        .send(result);
    }
  };
};

module.exports = driverService;