/* global Backendless */

'use strict';

Backendless.ServerCode.Persistence.afterCreate('*', function(req, res) {
    console.log('afterCreate:generic');
});