'use strict';

class ClassDef {
  constructor(name) {
    this.name = name;
    this.methods = {};
    this.properties = {};
  }

  property(name) {
    return this.properties[name] || (this.properties[name] = new PropertyDef());
  }

  method(name) {
    return this.methods[name] || (this.methods[name] = new MethodDef());
  }
}

class PropertyDef {
  type(value) {
    this.type = value;
    return this;
  }
}

class MethodDef {
  constructor() {
    this.params = [];
  }

  addParam(name, type) {
    this.params.push(new ParamDef(name, type));
  }
}

class ParamDef {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
}

class TypeDef {
  constructor(type) {
    this.name = TypeDef.trim(type);

    const elementType = TypeDef.parseElementType(type);

    if (elementType) {
      this.elementType = new TypeDef(elementType);
    }
  }

  static trim(type) {
    const splitterPos = type.indexOf('.');

    return type.substring(0, splitterPos !== -1 ? splitterPos : undefined);
  }

  static parseElementType(type) {
    const result = type.match(/<(.*)>/);

    return result && result[1] || '';
  }

  static fromDoc(doc) {
    const name = doc && doc.names && doc.names[0];

    return name && new TypeDef(name);
  }
}

class FileDescriptor {
  constructor() {
    this.classes = {};
  }

  addClass(name) {
    if (!this.classes[name]) {
      this.classes[name] = new ClassDef(name);
    }

    return this.classes[name];
  }
}

exports.describeClasses = function(fileName) {
  const fs = require('fs');
  const docs = require('jsdoc-api').explainSync({ source: fs.readFileSync(fileName) });

  const fd = new FileDescriptor();

  docs.forEach(item => {
    if (item.kind === 'typedef' || item.kind === 'class') { //class definition
      const classDef = fd.addClass(item.name);

      item.properties && item.properties.forEach(prop => {
        classDef.property(prop.name).type = TypeDef.fromDoc(prop.type);
      });

    } else if (item.memberof) { //class members

      if (item.kind === 'function') { //class method
        const methodDef = fd.addClass(item.memberof).method(item.name);
        methodDef.returnType = TypeDef.fromDoc(item.returns && item.returns[0] && item.returns[0].type);
        methodDef.access = item.access;

        if (item.params) {
          item.params.forEach(param => methodDef.addParam(param.name, TypeDef.fromDoc(param.type)));
        }

      } else if (item.kind === 'member' && item.scope === 'instance' && item.type) { //class property
        fd.addClass(item.memberof).property(item.name).type = TypeDef.fromDoc(item.type);
      }
    }
  });

  return Object.keys(fd.classes).map(name => fd.classes[name]);
};