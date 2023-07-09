# APIGateway with CORS, Lambdas, and CRUD on DynamoDB

This an example of an APIGateway with CORS enabled, pointing to five Lambdas executing CRUD operations on a single DynamoDB table.

## Build

To build this app, you need to be in this example's root folder. Then run the following:

```bash
npm install -g aws-cdk
npm install
npm run build
```

This will install the necessary CDK, then this example's dependencies, then the lambda functions' dependencies, and then build your TypeScript files and your CloudFormation template.

## Deploy

Run `cdk deploy` or `cdk deploy --profile`. This will deploy / redeploy your Stack to your AWS Account.

After the deployment you will see the API's URL, which represents the url you can then use.

## The Component Structure

The whole component contains:

- An API, with CORS enabled on all HTTP Methods. (Use with caution, for production apps you will want to enable only a certain domain origin to be able to query your API.)
- Lambda pointing to `lambdas/create.ts`, containing code for __storing__ an item  into the DynamoDB table.
- Lambda pointing to `lambdas/delete-one.ts`, containing code for __deleting__ an item from the DynamoDB table. // NOT YET IMPLEMENTED
- Lambda pointing to `lambdas/get-all.ts`, containing code for __getting all items__ from the DynamoDB table.
- Lambda pointing to `lambdas/get-one.ts`, containing code for __getting an item__ from the DynamoDB table.
- Lambda pointing to `lambdas/update-one.ts`, containing code for __updating an item__ in the DynamoDB table. // NOT YET IMPLEMENTED
- Lambda pointing to `lambdas/get-one-statistics.ts`, containing code for __getting a statistics__ in the DynamoDB table.
- A DynamoDB table `matches` that stores the data and another DynamoDB table `statistics` that stores processed data.
- Six `LambdaIntegrations` that connect these Lambdas to the API.

## CDK Toolkit

The [`cdk.json`](./cdk.json) file in the root of this repository includes
instructions for the CDK toolkit on how to execute this program.

After building your TypeScript code, you will be able to run the CDK toolkit commands as usual:

```bash
    $ cdk ls
    <list all stacks in this program>

    $ cdk synth
    <generates and outputs cloudformation template>

    $ cdk deploy
    <deploys stack to your account>

    $ cdk diff
    <shows diff against deployed stack>
```

## Helpers

cURL command for sending in data to DynamoDB.

```bash
curl --location --request POST '${URL That you get on cdk deploy}/matches' --header 'Content-Type: application/json' --user aws_access_key_id:aws_secret_access_key --aws-sigv4 'aws:amz:eu-west-2:execute-api' --data-raw '{"match_id": "54321", "timestamptmp":"2023-06-22T19:45:30Z", "team":"FC Barcelona", "opponent":"Real Madrid", "event_type":"goal", "event_details":{ "player":{"playerName":"Lionel Messi", "position":"Forward", "number":10}, "goal_type":"penality", "minute":30, "assist": {"playerName":"Sergio Busquete", "position":"Midfielder", "number":9}, "video_url":"https://example.com/goal_video.mp4"}}'
```

After deploy to get all matches go to:

```bash
https://yoururl.execute-api.eu-west-2.amazonaws.com/prod/matches
```
To get one match go to:
```bash
https://yoururl.execute-api.eu-west-2.amazonaws.com/prod/matches/{id}
```
To get statistics of a match go to:
```bash
https://yoururl.execute-api.eu-west-2.amazonaws.com/prod/matches/{id}/statistics
```