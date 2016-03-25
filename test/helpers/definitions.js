'use strict';

const ORDER = {
  name      : 'Order',
  methods   : {},
  properties: {
    items     : { type: { name: 'Array', elementType: { name: 'ShoppingItem' } } },
    orderPrice: { type: { name: 'Number' } }
  }
};

const SHOPPING_CART = {
  name      : 'ShoppingCart',
  properties: {},
  methods   : {
    addItem : { access: undefined, params: [], returnType: undefined },
    getItems: { access: undefined, params: [], returnType: undefined }
  }
};

const SHOPPING_CART_SERVICE = {
  name      : 'ShoppingCartService',
  properties: {},
  methods   : {
    addItem : {
      access    : 'public',
      returnType: { name: 'void' },
      params    : [
        { name: 'cartName', type: { name: 'String' } },
        { name: 'item', type: { name: 'ShoppingItem' } }
      ]
    },
    addItems: {
      access    : 'public',
      returnType: { name: 'void' },
      params    : [
        { name: 'cartName', type: { name: 'String' } },
        { name: 'items', type: { name: 'Array', elementType: { name: 'ShoppingItem' } } }
      ]
    },
    getCart : {
      access    : 'private',
      returnType: { name: 'ShoppingCart' },
      params    : [
        { name: 'cartName', type: { name: 'String' } }
      ]
    },
    purchase: {
      access: 'public',

      params: [
        { name: 'cartName', type: { name: 'String' } }
      ],

      returnType: { name: 'Promise', elementType: { name: 'Order' } }
    }
  }
};

const SHOPPING_ITEM = {
  name      : 'ShoppingItem',
  methods   : {},
  properties: {
    objectId: { type: { name: 'String' } },
    price   : { type: { name: 'Number' } },
    product : { type: { name: 'String' } },
    quantity: { type: { name: 'Number' } }
  }
};

exports.ORDER = ORDER;
exports.SHOPPING_CART = SHOPPING_CART;
exports.SHOPPING_CART_SERVICE = SHOPPING_CART_SERVICE;
exports.SHOPPING_ITEM = SHOPPING_ITEM;

exports.map = {
  Order              : ORDER,
  ShoppingCart       : SHOPPING_CART,
  ShoppingCartService: SHOPPING_CART_SERVICE,
  ShoppingItem       : SHOPPING_ITEM
};