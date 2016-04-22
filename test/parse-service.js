'use strict';

const assert   = require('assert'),
      executor = require('../lib/server-code/runners/tasks/executor'),
      argsUtil        = require('../lib/server-code/runners/tasks/util/args');

require('backendless').ServerCode = require('../lib/server-code/api');
require('mocha');

function createTask(path) {
  return {
    ___jsonclass : executor.RAI,
    initAppData  : {},
    actionType   : 'PARSE_CUSTOM_SERVICE',
    applicationId: '',
    relativePath : `test/${path}`
  };
}

function invoke(task, model) {
  return executor.execute(task, { backendless: { repoPath: '' } }, model)
    .then(res => res && JSON.parse(res))
    .then(res => {
      if (res && res.arguments) {
        res.arguments = res.arguments && argsUtil.decode(res.arguments);
      }

      return res;
    });
}

describe('[parse-service] task executor', function() {
  it('should parse found services', function() {
    return invoke(createTask('fixtures'))
      .then((res) => {
        assert.equal(res.exception, null);
        assert.deepEqual(res.arguments, [{
          'config' : [],
          'xml': '<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>\n<namespaces>\n  <namespace name=\"services\" fullname=\"services\">\n    <service name=\"ShoppingCartService\" fullname=\"services.ShoppingCartService\">\n      <method name=\"addItem\" type=\"void\" nativetype=\"void\" fulltype=\"void\" javatype=\"void\">\n        <arg name=\"cartName\" type=\"String\" nativetype=\"String\" fulltype=\"String\" javatype=\"java.lang.String\"/>\n        <arg name=\"item\" type=\"ShoppingItem\" nativetype=\"services.ShoppingItem\" fulltype=\"services.ShoppingItem\" javatype=\"services.ShoppingItem\"/>\n      </method>\n      <method name=\"addItems\" type=\"void\" nativetype=\"void\" fulltype=\"void\" javatype=\"void\">\n        <arg name=\"cartName\" type=\"String\" nativetype=\"String\" fulltype=\"String\" javatype=\"java.lang.String\"/>\n        <arg name=\"items\" type=\"Array\" nativetype=\"List&lt;services.ShoppingItem&gt;\" fulltype=\"Array\" javatype=\"java.util.List&lt;services.ShoppingItem&gt;\" elementType=\"ShoppingItem\"/>\n      </method>\n      <method name=\"purchase\" type=\"Order\" nativetype=\"services.Order\" fulltype=\"services.Order\" javatype=\"services.Order\">\n        <arg name=\"cartName\" type=\"String\" nativetype=\"String\" fulltype=\"String\" javatype=\"java.lang.String\"/>\n      </method>\n    </service>\n    <datatype name=\"ShoppingItem\" fullname=\"services.ShoppingItem\" typeNamespace=\"services\">\n      <field name=\"objectId\" type=\"String\" nativetype=\"String\" fulltype=\"String\" javatype=\"java.lang.String\"/>\n      <field name=\"product\" type=\"String\" nativetype=\"String\" fulltype=\"String\" javatype=\"java.lang.String\"/>\n      <field name=\"price\" type=\"Number\" nativetype=\"float\" fulltype=\"Number\" javatype=\"float\"/>\n      <field name=\"quantity\" type=\"Number\" nativetype=\"float\" fulltype=\"Number\" javatype=\"float\"/>\n    </datatype>\n    <datatype name=\"Order\" fullname=\"services.Order\" typeNamespace=\"services\">\n      <field name=\"items\" type=\"Array\" nativetype=\"List&lt;services.ShoppingItem&gt;\" fulltype=\"Array\" javatype=\"java.util.List&lt;services.ShoppingItem&gt;\" elementType=\"ShoppingItem\"/>\n      <field name=\"orderPrice\" type=\"Number\" nativetype=\"float\" fulltype=\"Number\" javatype=\"float\"/>\n    </datatype>\n  </namespace>\n  <runtime generationMode=\"FULL\">\n  </runtime>\n</namespaces>'
        }]);
      });
  });

  it('should handle no services', function() {
    return invoke(createTask('dummy-folder'))
      .then((res) => {
        assert.equal(res.exception, null);
        assert.deepEqual(res.arguments, []);
      });
  });
});
