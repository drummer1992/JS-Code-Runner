/* global Backendless */

'use strict';

Backendless.ServerCode.persistence.afterCreate((req, res) => {
    console.log('afterCreate');

    //stop further operation proceeding and respond to the client with a specific result
    return { foo: 'bar' };
});