'use strict';

const CodeRunner = require('../../lib'),
      fs         = require('fs');

const DIR = 'acceptance';

function prepareDir() {
  if (fs.existsSync(DIR)) {
    fs.readdirSync(DIR).forEach(function(file) {
      fs.unlinkSync(`${DIR}/${file}`);
    });

    fs.rmdirSync(DIR);
  }

  fs.mkdirSync(DIR);
}

function providerApi(provider) {
  return provider.id.substr(0, 1).toUpperCase() + provider.id.substring(1);
}

let nextId = 0;

class ServerCode {
  constructor(app) {
    this.id = nextId++;
    this.app = app;
    this.items = [];
  }

  addHandler(event, handler, context) {
    const p = event.provider;
    const ctx = p.targeted ? `'${context || '*'}'` : null;
    const handlerBody = `'use strict';` +
      `Backendless.ServerCode.${providerApi(p)}.${event.name}(${ctx ? ctx + ', ' : ''}${handler.toString()});`;

    this.items.push(handlerBody);
    return this;
  }

  addTimer(opts) {
    //TODO: implement me
    return this;
  }
  
  addService(service) {
    //TODO: implement me
    return this;
  }
  
  deploy() {
    prepareDir();

    this.items.forEach((item, i) => {
      fs.writeFileSync(`${DIR}/bl-${nextId}-${i}.js`, item);
    });

    return CodeRunner.deploy({
      backendless: {
        apiServer: this.app.server
      },
      app        : {
        id       : this.app.id,
        secretKey: this.app.blKey,
        version  : this.app.version,
        files    : ['!node_modules/**', `${DIR}/**`]
      }
    });
  }
}

module.exports = function(app) {
  return new ServerCode(app);
};