## Change Log

### v4.3.0-beta.11 (2017/05/12)
- increase model build time by loading only files relevant to the event

### v4.3.0-beta.10 (2017/05/11)
- use relations API in ShoppingCartService example
- fix (deploy) --keep-zip command line argument is ignored
- fix exclusion pattern is ignored during model build phase
- add setRelation and addRelation methods to PersistenceItem class

### v4.3.0-beta.9 (2017/04/28)
- add support for async service methods
- fix processing files whose names start from underscore

### v4.3.0-beta.5 (2017/04/08)
- fix (deploy) `require(...).publish is not a function`

### v4.3.0-beta.4 (2017/04/06)
- Standalone work in `cloud` mode . CodeRunnerDriver is not required anymore.

### v4.3.0-beta.1 (2017/03/29)
- For `pro` and `debug` modes, each task result is sent to a task-specific message broker channel
- runner registration is not required anymore to publish server code
- `app.files` config param was replaced by `app.exclude`. Coderunner now searches for all files in the current working
directory except those that matches `app.exclude` patterns

### v4.2.0-beta (2017/03/02)
- Service Methods now may have specific route defined in a jsdoc `@route` tag
- Route may include path params like `/order/{orderId}/item/{itemId}`
- Service and service methods description defined in jsdoc is visible in Backendless Dev Console
- In service method there is `this.request` containing the execution context including http path, headers, path params,
query params, user, user roles and so on

### v4.1.0-beta (2017/02/23)
- Add `Backendless.Request` giving a possibility to make one liner http requests from BL

### v4.0.3-beta (2017/02/21)
- add retry strategy for messages broker
- change secretKey naming to apiKey

### v4.0.1-beta (2017/02/07)
- add Backendless.ServerCode.Data alias to Backendless.ServerCode.Persistence
- pass config and context into Service constructor
- fix `JSDOC_ERROR: There are no input files to process` related to services/types defined
in a module without js extension
- stop logs sending attempt for RAI tasks

### v4.0.0-beta (2017/02/03)
- Backendless Server v4.0 support
- add socialRegister events support
- userToken of a user originated the BL execution to be injected into every Backendless API call made from the BL

### v1.11.0 (2017/02/20)
- add `Backendless.ServerCode.verbose()` method, giving a possibility to enable verbose logging mode

### v1.10.1 (2016/11/25)
- update Backendless SDK dependency to latest

### v1.9.1 (2016/11/22)
- resolve ___dates___ meta fields in server's JSON
- when critical error, exit with zero status code to avoid too noisy NPM complains

### v1.9.0 (2016/10/25)
- add `PRO` mode

### v1.8.0 (2016/08/17)
- in `CLOUD` mode the CodeRunner forwards all console logging 
(including CodeRunner task processing info) to `Backendless.Logging` which makes it possible to 
monitor deployed Business Logic
- When run in production, the CodeRunner now prints how much times it takes, to load a context specific 
business logic modules and their dependencies 

### v1.7.4 (2016/07/14)
- fix: `false` returned from service's method results in `null` result on client side

### v1.7.3 (2016/07/01)
- fix `HashMap cannot be cast to InvocationResult` error when invoking service method which returns non string value

### v1.7.2 (2016/06/14)
- change: same response shape for each task executors

### v1.7.1 (2016/06/08)
- fix `Can not parse generic service` error when publish service with third-party dependencies

### v1.7.0 (2016/06/01)
- show error line number in model summary output
- in 'verbose' mode print full stack trace of the module validation errors
- wrap a value returned from custom event handler into an object ({result: value})
except those cases where the value is already an object

### v1.6.0 (2016/05/25)
- multiple services is now allowed to deploy
- default service version is `1.0.0` (was `0.0.0`)

### v1.5.6 (2016/05/23)
- fix `timeout error` when custom event handler returns a `Function`
- fix publisher bug related to npm2 env and a module used by two other modules

### v1.5.5 (2016/05/16)
- update `eslint`, `backendless` to their latest versions
- fix `undefined` custom event name in model summary output
- remove redundant `(debug)` suffix from service name being registered for `debug`

### v1.5.4 (2016/04/28)
- fix `service not found` error in `cloud` mode
- increase server code parsing time in `cloud` mode

### v1.5.3 (2016/04/28)
- add temporary limitation to single service in deployment
- update `eslint`, `should`, `jszip` and `request` to their latest versions
- change service meta in the result of `PARSE-SERVICE` task as it is required by server
- make single call to api engine to register all debug services

### v1.5.2 (2016/04/28)
- optimize a list of dependencies included to the deployment in `npm3` env
- fix Runner can't find the code deployed from Windows machine

### v1.5.1 (2016/04/27)
- fix deployment does not include all dependencies in `npm3` env

### v1.5.0 (2016/04/27)
- update `backendless.js` to `v3.1.8`
- fix non-obvious error message (`handler not found`) that occurs in `cloud` mode at the time of script loading
- don't allow to deploy a server code that contains errors to production
- include all non dev dependencies into deployment zip
- print ServerCode error stack if run in verbose mode

### v1.4.2 (2016/04/25)
- fix `service not found` error in cloud mode
- make it possible to specify application files path pattern from command line
- in `debug` mode replace confusing service deployed message by service registered

### v1.4.1 (2016/04/25)
- update `backendless.js` dependency to `v3.1.7`

### v1.4.0 (2016/04/23)
- add support for services
- upgrade `redis` client to `v2.5.3`
- print more information about discovered business logic