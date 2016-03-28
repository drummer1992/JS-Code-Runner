'use strict';

const definitions     = require('./helpers/definitions').map,
      buildServiceXml = require('../lib/server-code/model/service-descriptor').buildXML;

require('mocha');
require('should');

const SHOPPING_CART_SERVICE_XML = `<?xml version="1.0" encoding="ISO-8859-1"?>
<namespaces>
  <namespace name="services" fullname="services">
    <service name="ShoppingCartService" fullname="ShoppingCartService">
      <method name="addItem" type="void" nativetype="void" fulltype="void" javatype="void">
        <arg name="cartName" type="String" nativetype="String" fulltype="String" javatype="java.lang.String"/>
        <arg name="item" type="ShoppingItem" nativetype="ShoppingItem" fulltype="ShoppingItem" javatype="ShoppingItem"/>
      </method>
      <method name="addItems" type="void" nativetype="void" fulltype="void" javatype="void">
        <arg name="cartName" type="String" nativetype="String" fulltype="String" javatype="java.lang.String"/>
        <arg name="items" type="Array" nativetype="List&lt;ShoppingItem&gt;" fulltype="Array" javatype="java.util.List&lt;ShoppingItem&gt;" elementType="ShoppingItem"/>
      </method>
      <method name="purchase" type="Order" nativetype="Order" fulltype="Order" javatype="Order">
        <arg name="cartName" type="String" nativetype="String" fulltype="String" javatype="java.lang.String"/>
      </method>
    </service>
    <datatype name="ShoppingItem" fullname="ShoppingItem" typeNamespace="services">
      <field name="objectId" type="String" nativetype="String" fulltype="String" javatype="java.lang.String"/>
      <field name="price" type="Number" nativetype="float" fulltype="Number" javatype="float"/>
      <field name="product" type="String" nativetype="String" fulltype="String" javatype="java.lang.String"/>
      <field name="quantity" type="Number" nativetype="float" fulltype="Number" javatype="float"/>
    </datatype>
    <datatype name="Order" fullname="Order" typeNamespace="services">
      <field name="items" type="Array" nativetype="List&lt;ShoppingItem&gt;" fulltype="Array" javatype="java.util.List&lt;ShoppingItem&gt;" elementType="ShoppingItem"/>
      <field name="orderPrice" type="Number" nativetype="float" fulltype="Number" javatype="float"/>
    </datatype>
  </namespace>
</namespaces>`;

describe('service descriptor', function() {
  it('should build valid service XML', function() {
    const serviceXml = buildServiceXml(['ShoppingCartService'], definitions);

    serviceXml.should.equal(SHOPPING_CART_SERVICE_XML);
  });
});