# Troubleshooting
### How do I debug after I have deployed business logic to the Backendless Cloud?
When the code is deployed, all `console.log` calls, in addition to the CodeRunner service messages, are redirected 
to `Backendless.Logging` API calls and will be saved in Backendless log files.

This results in a file with all logged messages located in `root/logging` folder in the `Files` section
See more on [Backendless.Logging documentation article](https://backendless.com/documentation/manage/mgmt_logging.htm)

Consider the following example of an `execute` function of a dummy [Heartbeat timer](https://github.com/Backendless/JS-Code-Runner/blob/master/examples/timers/heartbeat.js) :
 
```js
  //...
  execute: function() {
    console.log("I'm alive!");

    Backendless.Logging.getLogger('heartbeat').debug("I'm alive!");
  }
```

After this timer runs in production, you will find the following log messages in the logs :

<img src='http://i.imgur.com/wKnRWWo.png'>

### ServerCode works well in the DEBUG mode, but does not when deployed to the Cloud

First of all, make sure the code is getting invoked when a triggering event is raised. It could be an API call, a timer event, a custom event or a service invocation.

To verify this, open the Backendless Console, go to the `Files` section and check the files in the `logging` directory. You should see log messages in the `SERVER_CODE` logging category.

If you do not see any messages in that logging category and you are sure that the corresponding business logic triggering event is raised, please contact the Backendless support forum to resolve the issue.

The log messages may contain errors raised during business logic execution and this information may help you in diagnosing and fixing the problem.

If you see that the Business Logic execution was interrupted (for example, you see some of the `console.log` messages, but don't see the others), that means that you have some __undeclared__ asynchronous IO operations, which were interrupted by the CodeRunner. This happens when asynchronous operations started by your code are not properly returned to CodeRunner. Business logic method must return a Promise to CodeRunner which should be resolved only when all asynchronous jobs are finished.

This is explained in the [Sync vs Async Article](https://backendless.com/documentation/business-logic/js/bl_sync_vs_async_code.htm).

### Error in Cloud: `Cannot find module 'some_specific_third-party_module'`
This error may happen if one of the dependencies that you use, were not deployed into the Cloud along with the business logic.

When you add a new dependency to the project using `npm install` command, it is important to use the `--save` option so 
that the module is installed at the project level (rather than globally) and is added to `project.json` into the non dev 'dependencies' list. 

As a result, when the code is deployed to Backendless, the module will be included into the deployment scope. 
See also:
- [Node Modules in Backendless Business Logic](https://backendless.com/documentation/business-logic/js/bl_node_modules.htm)
- [npm install](https://docs.npmjs.com/cli/install)

### Error in Cloud: `Task execution is aborted due to timeout`

According to [Backendless Cloud functional limits](https://backendless.com/pricing/backendless-cloud-functional-limits/) the server code
 execution time is limited to 5 seconds in the free tier and may be extended to 20 seconds by purchasing corresponded option

When the code execution time exceeds its limit, it will be  interrupted and the timeout error will be arisen.

To resolve this situation, you have to analyse and optimize the code execution time or increase the limit by 
purchasing extended execution time packet

During the code analysis, pay attention at the following cases :

- If you perform asynchronous operations in the code and return the Promise to the CodeRunner, 
make sure you always resolve or reject it

- If you communicate with an external server in your business logic (`mailgun` for example), you have to ensure 
that [this server host is approved by Backendless](https://backendless.com/documentation/manage/mgmt_external_hosts.htm) 

- Third-party modules that you use may increase code execution time.

 The infrastructure which runs the Server Code is shared between multiple applications, the dependencies and code is loaded on every request.
 The same code runner container after it is done with one request can be used by other applications.
 As a result, all Business Logic must be stateless and initialization happens for every call.

 This places high demands on the code loading speed as it affects the overall code execution time.
 Due to size of the dependencies, it may take considerable time to load them from the distributed file system used on the server side. 
 You should review the dependency list and remove any non-critical dependencies
 
 The information about code and dependencies load time is provided with every Business logic invocation in the log messages
 See an image from the [How do I debug after I have deployed](Troubleshooting.md#how-do-i-debug-after-i-have-deployed-business-logic-to-the-backendless-cloud) section
 

### The size of my code is bigger than allowed in the current payment tier

You can decrease application deployment zip size by adding exclusion filters to your `app.files` config parameter which is 
located in the `{PROJECT_DIR}/coderunner.json` file.

This parameter contains an array of inclusion/exclusion patterns forming the content of the server code deployment. The default value of the parameter is a pattern which means 'include all files under `{PROJECT_DIR}/app` folder':

```
    "app": {
    "files": [
      "app/**"
    ]
  }
```
CodeRunner will automatically include into the deployment all non-dev dependencies from the node_modules folder listed in the `project.json` file.

Notice that `backendless-coderunner` is a `dev` dependency. When deploying your code to the client, all `dev` dependencies are excluded.

You can run the deployment with a few additional parameters which will give you more control of the deployment process:

```
npm run deploy -- --verbose --keep-zip
```

When using the `--verbose` parameter, you will see all applied deployment patterns which are declared in `app.files` configuration parameter.

When using the  `--keep-zip` parameter, once the deployment is complete (or even after you attempt to run it), you will find the `deploy.zip` file in the `{PROJECT_DIR}` folder. You will be able to check its size and the contents.

The cumulative size of the deployed code (which includes all the dependencies) is limited to 2 megabytes in the free tier of Backendless Cloud. The limit can be expanded by purchasing a Function Pack from the Backendless Marketplace.

To reduce the deployment size, consider minimizing the installation of the dependencies to only the ones your the code needs/uses.

Additionally, you may apply additional filtering to identify what should be skipped from the depended module's folder. For instance, if {some_module} has the `examples` folder you may omit its inclusion by adding the following exclusion pattern in app.files - `!node_modules/some_module/examples`

Some of this information can be found in the README file of the generated and downloaded from the console servercode project. 
There are several examples of app.files config parameter tweaking.
