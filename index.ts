import { IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class ApiLambdaCrudDynamoDBStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id);

    const ingestDynamoTable = new dynamodb.Table(this, 'matches', {
      partitionKey: {
        name: 'itemId',
        type: dynamodb.AttributeType.STRING
      },
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      tableName: 'matches',

      /**
       *  The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new table, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will delete the table (even if it has data in it)
       */
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const processDynamoTable = new dynamodb.Table(this, 'statistics', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      tableName: 'statistics',

      /**
       *  The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new table, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will delete the table (even if it has data in it)
       */
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
      environment: {
        PRIMARY_KEY: 'itemId',
        TABLE_NAME: ingestDynamoTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    }

    // Create a Lambda function for DynamoDB stream processing
    const processDynamoLambda = new NodejsFunction(this, 'processDynamoLambda', {
      entry: join(__dirname, 'lambdas', 'process-dynamo.ts'),
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
      environment: {
        PRIMARY_KEY: 'id',
        TABLE_NAME: processDynamoTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    });

    processDynamoLambda.addEventSource(new DynamoEventSource(ingestDynamoTable, {
      startingPosition: lambda.StartingPosition.LATEST,
    }));

    // Create a Lambda function for getting statistics

    const getOneStatisticsLambda = new NodejsFunction(this, 'getOneStatisticsFunction', {
      entry: join(__dirname, 'lambdas', 'get-one-statistics.ts'),
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
      environment: {
        PRIMARY_KEY: 'id',
        TABLE_NAME: processDynamoTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    });

    // Create a Lambda function for each of the CRUD operations
    const getOneLambda = new NodejsFunction(this, 'getOneMatchFunction', {
      entry: join(__dirname, 'lambdas', 'get-one.ts'),
      ...nodeJsFunctionProps,
    });
    const getAllLambda = new NodejsFunction(this, 'getAllMatchesFunction', {
      entry: join(__dirname, 'lambdas', 'get-all.ts'),
      ...nodeJsFunctionProps,
    });
    const createOneLambda = new NodejsFunction(this, 'createMatchFunction', {
      entry: join(__dirname, 'lambdas', 'create.ts'),
      ...nodeJsFunctionProps,
    });
    const updateOneLambda = new NodejsFunction(this, 'updateMatchFunction', {
      entry: join(__dirname, 'lambdas', 'update-one.ts'),
      ...nodeJsFunctionProps,
    });
    const deleteOneLambda = new NodejsFunction(this, 'deleteMatchFunction', {
      entry: join(__dirname, 'lambdas', 'delete-one.ts'),
      ...nodeJsFunctionProps,
    });

    // Grant the Lambda function read access to the DynamoDB table
    ingestDynamoTable.grantReadWriteData(getAllLambda);
    ingestDynamoTable.grantReadWriteData(getOneLambda);
    ingestDynamoTable.grantReadWriteData(createOneLambda);
    ingestDynamoTable.grantReadWriteData(updateOneLambda);
    ingestDynamoTable.grantReadWriteData(deleteOneLambda);

    // Grant the Lambda function read access to the DynamoDB table
    processDynamoTable.grantReadWriteData(processDynamoLambda);
    processDynamoTable.grantReadWriteData(getOneStatisticsLambda);


    // Integrate the Lambda functions with the API Gateway resource
    const getAllIntegration = new LambdaIntegration(getAllLambda);
    const createOneIntegration = new LambdaIntegration(createOneLambda);
    const getOneIntegration = new LambdaIntegration(getOneLambda);
    const updateOneIntegration = new LambdaIntegration(updateOneLambda);
    const deleteOneIntegration = new LambdaIntegration(deleteOneLambda);
    const getOneStatisticsIntegration = new LambdaIntegration(getOneStatisticsLambda);


    // Create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, 'matchesApi', {
      restApiName: 'Matches Service'
    });

    const matches = api.root.addResource('matches');
    matches.addMethod('GET', getAllIntegration);
    matches.addMethod('POST', createOneIntegration);
    addCorsOptions(matches);

    const singleMatch = matches.addResource('{id}');
    singleMatch.addMethod('GET', getOneIntegration);
    singleMatch.addMethod('PATCH', updateOneIntegration);
    singleMatch.addMethod('DELETE', deleteOneIntegration);
    addCorsOptions(singleMatch);

    const singleStatistics = singleMatch.addResource('statistics');
    singleStatistics.addMethod('GET', getOneStatisticsIntegration);
    addCorsOptions(singleStatistics);
  }
}

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}

const app = new App();
new ApiLambdaCrudDynamoDBStack(app, 'CDKDemoApiLambdaCrudDynamoDB');
app.synth();
