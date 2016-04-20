/* global Backendless */

'use strict';

const Order = require('../models/order');

class ShoppingCart {
  constructor(opts) {
    opts = opts || {};

    this.name = opts.name;
    this.items = opts.items || [];
    this.___class = ShoppingCart.name;
  }

  addItem(item) {
    item.objectId = null;

    this.items.push(item);
  }

  deleteItem(product) {
    const idx = this.items.findIndex(item => item.product === product);

    if (idx === -1) {
      throw new Error(`No ${product} in cart`);
    }

    this.items.splice(idx, 1);

    return this;
  }

  setQuantity(product, quantity) {
    const productItem = this.items.find(item => item.product === product);

    if (!productItem) {
      throw new Error(`No [${product}] in cart`);
    }

    productItem.quantity = quantity;

    return this;
  }

  getItems() {
    return this.items;
  }

  destroy() {
    Backendless.Cache.remove(this.name, this);
  }

  save() {
    Backendless.Cache.put(this.name, this);
  }

  static get(name, mustExist) {
    Backendless.Cache.setObjectFactory(ShoppingCart.name, ShoppingCart);

    return Backendless.Cache.get(name).then(cart => {
      if (!cart && mustExist) {
        throw new Error(`Shopping cart [${name}] does not exist`);
      }

      return cart;
    });
  }
}

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