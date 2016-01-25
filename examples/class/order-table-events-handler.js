const PersistenceEventsHandler = require('backendless-coderunner').EventsHandlers.Persistence;

class OrderTableEventsHandler extends PersistenceEventsHandler('Order') {
  beforeRemove() {
    //Your code here
  }

  afterRemoveSync() {
    //Your code here
  }
}

module.exports = OrderTableEventsHandler;