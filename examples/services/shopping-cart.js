/* global Backendless */

'use strict';

const Order        = require('../models/order'),
      ShoppingCart = require('../models/shopping-cart');

class ShoppingCartService {

  /**
   * @param {String} cartName
   * @param {ShoppingItem} item
   * @returns {Promise.<void>}
   */
  addItem(cartName, item) {
    return this.addItems(cartName, [item]);
  }

  /**
   * @param {String} cartName
   * @param {Array.<ShoppingItem>} items
   * @returns {Promise.<void>}
   */
  addItems(cartName, items) {
    return ShoppingCart.get(cartName).then(cart => {
      if (!cart) {
        cart = new ShoppingCart({ name: cartName });
      }

      items.forEach(item => cart.addItem(item));

      return cart.save();
    });
  }

  /**
   * @param {String} cartName
   * @param {String} product
   * @returns {Promise.<void>}
   */
  deleteItem(cartName, product) {
    return ShoppingCart.get(cartName, true).then(cart => cart.deleteItem(product).save());
  }

  /**
   * @param {String} cartName
   * @returns {Promise.<Array.<ShoppingItem>>}
   */
  getItems(cartName) {
    return ShoppingCart.get(cartName, true).then(cart => cart.getItems());
  }

  /**
   * @param {String} cartName
   * @param {String} productName
   * @param {Number} quantity
   * @returns {Promise.<void>}
   */
  setQuantity(cartName, productName, quantity) {
    return ShoppingCart.get(cartName, true).then(cart => cart.setQuantity(productName, quantity).save());
  }

  /**
   * @param {String} cartName
   * @returns {Promise.<Order>}
   */
  purchase(cartName) {
    return ShoppingCart.get(cartName, true).then(cart => {
      const order = new Order(cart.getItems());

      return order.save()
        .then(() => cart.destroy())
        .then(() => order);
    });
  }
}

Backendless.enablePromises();
Backendless.ServerCode.addService(ShoppingCartService);