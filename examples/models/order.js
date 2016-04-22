/* global Backendless */

'use strict';

class Order extends Backendless.ServerCode.PersistenceItem {
  constructor(items) {
    super();

    /**
     * @type {Array.<ShoppingItem>}
     */
    this.items = items || [];

    /**
     * @type {Number}
     */
    this.orderPrice = this.items.reduce((sum, item) => {
      return (sum || 0) + (item.price * item.quantity);
    }, 0);
  }
}

module.exports = Backendless.ServerCode.addType(Order);