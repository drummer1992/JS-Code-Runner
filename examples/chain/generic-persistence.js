"use strict";

let PersistenceEventsHandler = require('../../lib/api/handler').Persistance;

module.exports = PersistenceEventsHandler
  .for('Product')

  .beforeCreate((context, req) => {
    console.log(context, req);
  })

  .afterRemove((context, req, res) => {
    console.log(context, req, res);
  }, true);