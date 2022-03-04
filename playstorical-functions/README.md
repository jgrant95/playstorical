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