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
