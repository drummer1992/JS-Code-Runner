/* global Backendless */

'use strict';

Backendless.enablePromises();
// Backendless.ServerCode.User.afterRegister((req, res) => {
//   if (res.result) {
//     return Backendless.UserService.assignRole(res.result.email, 'MyCustomRole');
//   }
// });