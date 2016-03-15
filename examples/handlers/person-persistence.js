/* global Backendless */

'use strict';

Backendless.ServerCode.Persistence.afterCreate('Person', (req, res) => {
    console.log('afterCreate:person');

    //circular reference should not be a problem
    req.item.innerItem = req.item;
});

Backendless.ServerCode.Persistence.beforeRemove('Person', req => {
    console.log('beforeRemove:person');

    throw new Error('No way');
});

Backendless.ServerCode.Persistence.beforeCreate('Person', (req, res) => {
    console.log('beforeCreate:person');

    req.item.name = 'Modified Name';
    req.item.secondName = 'An additional Property';

    return new Promise((resolve) => {
        setTimeout(resolve, 1000);
    });
});
