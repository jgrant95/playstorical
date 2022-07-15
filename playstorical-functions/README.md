# Playstorical Functions

## Adding new functions
1. Using vscode azure extension `Create function` or use cli command `func new` in playstorical-function directory.
2. Once created, ensure the `function.json` contains the correct configuration.
    - For cosmosdb it's important to enter the `connectionStringSetting` (for the playstorical db, it's `playstoricalCosmosdb`) and the rest of the db config.
3. For deployment, all that needs to be updated is the `webpack.config.js` file, specially the `entry` property. 
    - The `entry` property must contain a property with the name of the function added, and the value of it's path. For example: 
    ```
    ...
    entry: {
        SnapshotCosmosTrigger: path.resolve(__dirname, './SnapshotCosmosTrigger/')
    }
    ...
    ```
  }

---
### Resources Used:
- https://dev.to/dnasir/azure-functions-node-js-typescript-webpack-a3m 
- https://docs.microsoft.com/en-us/azure/azure-functions/functions-add-output-binding-cosmos-db-vs-code?tabs=in-process&pivots=programming-language-javascript
- https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-cosmosdb-v2-trigger?tabs=javascript
- [Function binding retries](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-errors?tabs=javascript)
- [Azure Function developer guide](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=v2-v3-v4-export%2Cv2-v3-v4-done%2Cv2%2Cv2-log-custom-telemetry%2Cv2-accessing-request-and-response%2Cwindows-setting-the-node-version)