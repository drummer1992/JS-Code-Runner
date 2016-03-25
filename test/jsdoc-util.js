'use strict';

const jsdoc       = require('../lib/util/jsdoc'),
      definitions = require('./helpers/definitions'),
      should      = require('should');

require('mocha');

describe('jsdoc util', function() {
  it('should detect and explain classes in file', function() {
    const classes = jsdoc.describeClasses('test/fixtures/shopping-cart.js');

    should.equal(classes.length, 4);
    
    classes[0].should.be.eql(definitions.ORDER);
    classes[1].should.be.eql(definitions.SHOPPING_CART);
    classes[2].should.be.eql(definitions.SHOPPING_CART_SERVICE);
    classes[3].should.be.eql(definitions.SHOPPING_ITEM);
  });
});