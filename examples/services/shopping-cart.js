/* global Backendless */

'use strict';

Backendless.enablePromises();

class Order extends Backendless.ServerCode.PersistenceItem {
  constructor(items) {
    /**
     * @type {Array.<ShoppingItem>}
     */
    this.items = items;

    /**
     * @type {Number}
     */
    this.orderPrice = items.reduce((sum, item) => (sum || 0) + (item.price * item.quantity));
  }
}

class ShoppingCart {
  constructor() {
    this.items = [];
  }

  addItem(item) {
    this.items.push(item);
  }

  getItems() {
    return this.items;
  }
}

class ShoppingCartService {

  /**
   * A custom type can be described in jsdoc typedef declaration without having its own class
   * This will help to build a valid Swager doc but the CodeRunner won't be able to transform a plain JS object
   * from the request into concrete class.
   *
   * @typedef {Object} ShoppingItem
   * @property {String} objectId
   * @property {String} product
   * @property {Number} price
   * @property {Number} quantity
   */

  /**
   * @public
   * @param {String} cartName
   * @param {ShoppingItem} item
   * @returns {void}
   */
  addItem(cartName, item) {
    return ShoppingCartService.getCart(cartName).then(shoppingCart => {
      if (!shoppingCart) {
        shoppingCart = new ShoppingCart();
      }

      shoppingCart.addItem(item);
      item.objectId = null;

      return Backendless.Cache.put(cartName, shoppingCart);
    });
  }

  /**
   * @public
   * @param {String} cartName
   * @returns {Promise.<Order>}
   */
  purchase(cartName) {
    return ShoppingCartService.getCart(cartName).then(shoppingCart => {
      if (!shoppingCart) {
        throw new Error(`Shopping cart ${cartName} does not exist`);
      }

      const order = new Order(shoppingCart.getItems());

      return order.save()
        .then(() => Backendless.Cache.delete(cartName))
        .then(() => order);
    });
  }

  /**
   * @private
   * @param {String} cartName
   * @returns {ShoppingCart}
   */
  static getCart(cartName) {

    return Backendless.Cache.get(cartName, ShoppingCart)
      .then(result => result === 'null' ? null : result); //TODO: bug workaround
  }
}

Backendless.ServerCode.addType(Order);
Backendless.ServerCode.addService(ShoppingCartService);