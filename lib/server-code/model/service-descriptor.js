'use strict';

const xml = require('xml');
const NAMESPACE = 'services';

const typesMapping = {
  STRING : { javaType: 'java.lang.String' },
  BOOLEAN: { javaType: 'boolean', nativeType: 'bool' },
  NUMBER : { javaType: 'float', nativeType: 'float' },
  ARRAY  : { javaType: generic('javaType', 'java.util.List'), nativeType: generic('nativeType', 'List') },
  OBJECT : { javaType: 'java.lang.Object' },
  DATE   : { javaType: 'java.util.Date', nativeType: 'DateTime' }
};

function generic(nature, type) {
  return function(elementType) {
    return elementType ? `${type}<${elementType[nature]}>` : type;
  };
}

function unwrapPromise(type) {
  return type && type.name === 'Promise' ? unwrapPromise(type.elementType) : type;
}

function getTypeMapping(type) {
  type = unwrapPromise(type) || { name: 'void' };

  const mapped = typesMapping[type.name.toUpperCase()];
  const mappedSubType = type.elementType && getTypeMapping(type.elementType);

  function resolve(nature) {
    let result = mapped && mapped[nature];

    if (typeof result === 'function') {
      result = result(mappedSubType);
    }

    return result || type.name;
  }

  return {
    type       : resolve('type'),
    javaType   : resolve('javaType'),
    nativeType : resolve('nativeType'),
    fullType   : resolve('fullType'),
    elementType: mappedSubType && mappedSubType.type
  };
}

function buildServiceXml(serviceName, definitions) {
  const serviceNode = [{ _attr: { name: serviceName, fullname: serviceName } }];
  const nsNode = [{ _attr: { name: NAMESPACE, fullname: NAMESPACE } }, { service: serviceNode }];
  const serviceDef = definitions[serviceName];
  const types = new Set();

  function registerType(type) {
    if (type && definitions[type] && !types.has(type)) {
      nsNode.push(dataTypeNode(definitions[type]));
      types.add(type);
    }
  }

  function typedNode(name, type) {
    const mapping = getTypeMapping(type);

    const result = {
      name      : name,
      type      : mapping.type,
      nativetype: mapping.nativeType,
      fulltype  : mapping.fullType,
      javatype  : mapping.javaType
    };

    mapping.elementType && (result.elementType = mapping.elementType);

    registerType(result.type);
    registerType(result.elementType);

    return result;
  }

  function dataTypeNode(definition) {
    const datatype = [];
    datatype.push({ _attr: { name: definition.name, fullname: definition.name, typeNamespace: NAMESPACE } });

    Object.keys(definition.properties).forEach(propName => {
      datatype.push({ field: { _attr: typedNode(propName, definition.properties[propName].type) } });
    });

    return { datatype: datatype };
  }
  
  if (serviceDef) {
    Object.keys(serviceDef.methods).forEach(name => {
      const method = serviceDef.methods[name];

      if (method.access !== 'private') {
        const methodNode = [{
          _attr: typedNode(name, method.returnType)
        }];

        method.params.forEach(param => {
          methodNode.push({
            arg: {
              _attr: typedNode(param.name, param.type)
            }
          });
        });

        serviceNode.push({ method: methodNode });
      }
    });
  }

  return xml({ namespaces: [{ namespace: nsNode }] }, { declaration: { encoding: 'ISO-8859-1' }, indent: '  ' });
}

exports.buildXML = buildServiceXml;