# Troubleshooting

### ServerCode works perfect in DEBUG mode but does not when deployed

First of all, make sure the code is getting invoked when the related Business Event is raised. 
To verify this, in the Development Console, go to `Files` section and check for corresponding `SERVER_CODE` category 
log messages in the log files of the `logging` folder.

If you do not see such messages and you are sure that the corresponding business event was raised, please 
contact Backendless support forum to resolve the issue

The log messages may contain an errors raised during Business logic execution and this information may help you to fix them

If you see that some the Business Logic execution was interrupted (for example, you see some `console.log` messages but don't see the others), 
that means that you have some undeclared asynchronous IO operations which were interrupted by the CodeRunner due to 
unawareness of them.
Such business logic method must return a Promise to the CodeRunner which should be resolved only when all asynchronous jobs are finished
This is explained in the [Sync vs Async Article](https://backendless.com/documentation/business-logic/js/bl_sync_vs_async_code.htm)


### How do I debug after I have deployed ?
When the code is deployed, all `console.log` calls, in addition to the CodeRunner service messages, are redirected 
to `Backendless.Logging` API calls.

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

After this timer run in production, you will find the following log messages in the logs :

<img src='http://imgur.com/a/OhfM3' width='70%'>


### The size of my code is bigger than allowed in the current payment tier

You can decrease an application deployment zip size by adding an exclusion filters to your `app.files` config parameter which is 
located in the `{PROJECT_DIR}/coderunner.json` file

This parameter contains an array of inclusion/exclusion patterns forming the content of the server code deployment

By default it contains a pattern which is described as 'include all files under `{PROJECT_DIR}/app` folder'.

Automatically, CodeRunner will include to the deployment all non-dev dependencies from the node_modules folder listed in the `project.json`.

`backendless-coderunner` is a `dev` dependency and those will be skipped

You can run the deployment with few additional parameters which will give you more control on what's going on

```
npm run deploy -- --verbose --keep-zip
```

With `--verbose` parameter, you will see all deployment patterns applied (declared in `app.files` param explicitly and automatically added)

With `--keep-zip` parameter, after deployment (or its attempt) you will find `deploy.zip` file in the `{PROJECT_DIR}` folder. You will be able to check its size and the content

Cumulative size of the deployed code (which includes all dependencies) is limited for the Backendless Online deployments to 2 megabytes. It can be expanded by purchasing a Function Pack from the Backendless Marketplace

To reduce the deployment size, consider minimizing the installation of the dependencies to only what the code needs

Additionally you may filter of what from the depended module folder should be skipped. For instance if {some_module} has an `examples` folder you may omit its inclusion by adding the following exclusion pattern to app.files - `!node_modules/some_module/examples`

Some of this information can be found in the README file of the generated and downloaded from the console servercode project. 
There are several examples of app.files config parameter tweaking