'use strict';

const jsdoc  = require('../lib/util/jsdoc'),
      should = require('should');

require('mocha');

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

describe('jsdoc util', function() {
  it('should detect and explain classes in file', function() {
    const classes = jsdoc.describeClasses('test/fixtures/shopping-cart.js');

    should.equal(classes.length, 4);
    classes[0].should.be.eql(ORDER);
    classes[1].should.be.eql(SHOPPING_CART);
    classes[2].should.be.eql(SHOPPING_CART_SERVICE);
    classes[3].should.be.eql(SHOPPING_ITEM);
  });
});