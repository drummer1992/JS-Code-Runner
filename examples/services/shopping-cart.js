/* global Backendless */

'use strict';

class Order extends Backendless.ServerCode.PersistenceItem {
  constructor(items) {
    super();

    /**
     * @type {Array.<ShoppingItem>}
     */
    this.items = items;

    /**
     * @type {Number}
     */
    this.orderPrice = items.reduce((sum, item) => {
      return (sum || 0) + (item.price * item.quantity);
    }, 0);
  }
}

class ShoppingCart {
  constructor(opts) {
    opts = opts || {};

    this.items = opts.items || [];
    this.___class = ShoppingCart.name;
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
   * @returns {Promise<void>}
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
    Backendless.Cache.setObjectFactory(ShoppingCart.name, ShoppingCart);

    return Backendless.Cache.get(cartName);
  }
}

Backendless.enablePromises();
Backendless.ServerCode.addType(Order);
Backendless.ServerCode.addService(ShoppingCartService);