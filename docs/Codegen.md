# Code Generation
  Custom business logic generator simplifies the development process. The code generator is a part of Backendless Console. Developers use the graphical interface to select API events and schedule timers for which the system generates code in real-time. The generated code includes everything a developer needs in order to add custom business logic.

  1. Please follow [this instruction](https://backendless.com/documentation/business-logic/js/bl_code_generation.htm) to generate and download the code. Generated zip file contains generated code and package.json with a single `backendless-coderunner` dependency.
  2. After generating, downloading and unzipping the code, install the coderunner :

    `npm i`

  3. Modify the code according to your needs.
  4. Debug Code
  
    `npm run debug`
    
  5. Deploy to production:

    `npm run deploy`