# Create & Connect Cosmos Database
## Cosmos NoSql, Azure Functions, Node, Typescript, React, Static Web App

# Create Cosmos Database

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to your Resource Group
3. Create a new Resource
4. Search for "Azure Cosmos DB" and select "Azure Cosmos DB"
5. Click "Create"
6. Choose "Azure Cosmos DB for NoSQL"
    - You can select any database you want
7. Configure the resource:
    - **Resource Group:** `test-group`
    - **Account Name:** `cosmos-test-group`
    - **Location:** (US) West US
    - **Capacity mode:** Serverless
    - **Note:** We won't cover security in this guide, but please ensure you secure your database and follow Microsoft's best practices.
8. Click "Review + Create"

# Create Database and Container

1. Go to your new Cosmos NoSQL Resource
2. Open Data Explorer
3. Create a New Container:
    - **Database id:** `test-database`
    - **Container id:** `test-container`
    - **Partition key:** `id`
4. Click "OK"

# Get Cosmos Endpoint and Key

1. Navigate to your Cosmos DB resource > Settings > Keys
2. Note down the URL
3. Note down the Primary Key

# Open Project in Visual Studio Code

1. Navigate to your api directory:
    ```sh
    cd api
    ```
2. Install the Azure Cosmos DB npm package:
    ```sh
    npm install @azure/cosmos
    ```
3. Add `local.settings.json` to `./api` and update the following:
    - **COSMOS_ENDPOINT** from Cosmos
    - **COSMOS_KEY** from Cosmos

    ```json
    {
      "IsEncrypted": false,
      "Values": {
        "FUNCTIONS_WORKER_RUNTIME": "node",
        "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
        "AzureWebJobsStorage": "UseDevelopmentStorage=true",
        "COSMOS_DATABASE": "test-database",
        "COSMOS_CONTAINER": "test-container",
        "COSMOS_ENDPOINT": "https://example.documents.azure.com:443/",
        "COSMOS_KEY": "xxxxxxxxx"
      },
      "Host": {
        "LocalHttpPort": 7071,
        "CORS": "*",
        "CORSCredentials": false
      }
    }
    ```

4. Add `getExample.ts` to `./src/functions`:
    ```ts
    import { CosmosClient } from "@azure/cosmos";
    import {
        app,
        HttpResponseInit,
    } from "@azure/functions";

    export async function getExample(): Promise<HttpResponseInit> {
        try {
            //structure of the object im going to fetch
            type Example = {
                id: string;
                name: string;
            }

            //check all the environment variables
            if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY || !process.env.COSMOS_DATABASE || !process.env.COSMOS_CONTAINER) {
                return {
                    status: 500,
                    body: JSON.stringify({ error: "Please provide a valid Cosmos DB configuration" }),
                };
            }

            //cosmos db connection
            const databaseId = process.env.COSMOS_DATABASE
            const containerId = process.env.COSMOS_CONTAINER
            const options = {
                endpoint: process.env.COSMOS_ENDPOINT,
                key: process.env.COSMOS_KEY,
                userAgentSuffix: "CosmosDBJavascriptQuickstart",
            };

            //Create a client to interact with the database
            const client = new CosmosClient(options);

            //Query the database to get the first 50 items
            const results = await client.database(databaseId)
                .container(containerId)
                .items.query<Example>(`SELECT TOP 50 * FROM c`)
                .fetchAll();

            return {
                status: 200,
                body: JSON.stringify(results.resources),
            };
        } catch (error: any) {
            return {
                status: 500,
                body: JSON.stringify({ error: error.message }),
            };
        }
    }

    app.http("getExample", {
        methods: ["GET"],
        authLevel: "anonymous",
        handler: getExample,
    });
    ```

5. Add `upsertExample.ts` to `./src/functions`:
    ```ts
        import {
    app,
    HttpRequest,
    HttpResponseInit,
    } from "@azure/functions";
    import { CosmosClient } from "@azure/cosmos";

    export async function upsertExample(
    request: HttpRequest,
    ): Promise<HttpResponseInit> {
    try {

        //structure of the object im going to fetch
        type Example = {
        id: string;
        name: string;
        }

        //check all the environment variables
        if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY || !process.env.COSMOS_DATABASE || !process.env.COSMOS_CONTAINER) {
        return {
            status: 500,
            body: JSON.stringify({ error: "Please provide a valid Cosmos DB configuration" }),
        };
        }

        //cosmos db connection
        const databaseId = process.env.COSMOS_DATABASE
        const containerId = process.env.COSMOS_CONTAINER
        const options = {
        endpoint: process.env.COSMOS_ENDPOINT,
        key: process.env.COSMOS_KEY,
        userAgentSuffix: "CosmosDBJavascriptQuickstart",
        };

        //Cherck if the request has a body
        if (!request.body) {
        //If not, return an error
        return {
            status: 400,
            body: JSON.stringify({ error: "Please provide a valid item" }),
        };
        }

        //Parse the body of the request
        const example = await request.json() as Example;

        //Create a client to interact with the database
        const client = new CosmosClient(options);

        //Upsert the item to the database
        const { item } = await client.database(databaseId)
        .container(containerId)
        .items.upsert(example);

        //Read the item response from the database
        const { resource: createdItem } = await item.read<Example>();

        //Return the item created
        const response: HttpResponseInit = {
        status: 200,
        body: JSON.stringify(createdItem),
        };

        return response;
    } catch (error: any) {
        return {
        status: 500,
        body: JSON.stringify({ error: error.message }),
        };
    }
    }

    app.http("upsertExample", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: upsertExample,
    });

    ```

## Frontend

1. Create a `.env.local` file in `./frontend/` and add the following:
    ```sh
    VITE_API_URL=http://localhost:7071
    ```

2. Replace the content of `App.tsx`:
    ```ts
    import { useEffect, useState } from 'react'
    import './App.css'

    const API_URL = import.meta.env.VITE_API_URL
    type Example = {
    id: string
    name: string
    }

    function App() {
    const [examples, setExamples] = useState<Example[]>([])

    useEffect(() => {
        fetchExampleDATA()
    }, [])

    const fetchExampleDATA = async () => {
        try {
        const url = API_URL ? `${API_URL}/api/getExample` : '/api/getExample'
        const response = await fetch(url)
        const data = await response.json()
        setExamples(data)
        } catch (error) {
        console.error(error)
        }
    }

    const postExampleDATA = async () => {
        try {
        const response = await fetch(`${API_URL}/api/upsertExample`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: "", name: `example ${examples.length}` }),
        })
        const data = await response.json() as Example
        setExamples([...examples, data])
        }
        catch (error) {
        console.error
        }
    }

    return (
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        }}>
        <h1>Examples</h1>
        <ul>
            {examples.map((example) => (
            <li key={example.id}>{example.name}</li>
            ))}
        </ul>
        <button onClick={postExampleDATA}>Post Example Data</button>
        </div>
    )
    }

    export default App
    ```

## Setting Up Production Environment

1. Go to the [Azure Portal](https://portal.azure.com/)
2. Go TO Static Web App
3. Settings > Enviorment Variables
2. Set Enviorment Keys
    1. "COSMOS_DATABASE": "test-database",
    2. "COSMOS_CONTAINER": "test-container",
    3. "COSMOS_ENDPOINT": "xxxxxxxxx",
    4. "COSMOS_KEY": "xxxxxxxxx"
