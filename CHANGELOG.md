## Change Log

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