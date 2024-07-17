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