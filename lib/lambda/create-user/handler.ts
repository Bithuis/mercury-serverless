export async function handler(event: string, context: any) {
    console.log(`Stage Name is: ${process.env.stageName}`);
    console.log(`Event is: ${event}`);

    return {
        body: "Hello World",
        statusCode: 200
    }
}

