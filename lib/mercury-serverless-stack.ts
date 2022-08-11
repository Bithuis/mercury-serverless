import { Stack, StackProps } from 'aws-cdk-lib';
import { IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table, ProjectionType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path'

export class MercuryServerlessStack extends Stack {
  constructor(scope: Construct, id: string, stageName: string, props?: StackProps) {
    super(scope, id, props);

    const userTable = new Table(this, 'users', {
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING
      },
      tableName: 'users',
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });

    const budgetTable = new Table(this, 'budgets', {
      partitionKey: {
        name: 'budgetId',
        type: AttributeType.STRING
      },
      tableName: 'budgets',
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });

    budgetTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      projectionType: ProjectionType.ALL,
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
      environment: {
        BUDGET_PRIMARY_KEY: 'budgetId',
        USER_TABLE_NAME: userTable.tableName,
        BUDGET_TABLE_NAME: budgetTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    }

    const getOneLambda = new NodejsFunction(this, 'getOneBudgetFunction', {
      entry: join(__dirname, 'lambdas', 'get-one.ts'),
      ...nodeJsFunctionProps,
    });
    const getAllLambda = new NodejsFunction(this, 'getAllbudgetsFunction', {
      entry: join(__dirname, 'lambdas', 'get-all.ts'),
      ...nodeJsFunctionProps,
    });
    const createOneLambda = new NodejsFunction(this, 'createBudgetFunction', {
      entry: join(__dirname, 'lambdas', 'create.ts'),
      ...nodeJsFunctionProps,
    });
    const updateOneLambda = new NodejsFunction(this, 'updateBudgetFunction', {
      entry: join(__dirname, 'lambdas', 'update-one.ts'),
      ...nodeJsFunctionProps,
    });
    const deleteOneLambda = new NodejsFunction(this, 'deleteBudgetFunction', {
      entry: join(__dirname, 'lambdas', 'delete-one.ts'),
      ...nodeJsFunctionProps,
    });

    userTable.grantReadWriteData(getAllLambda);
    userTable.grantReadWriteData(getOneLambda);
    userTable.grantReadWriteData(createOneLambda);
    userTable.grantReadWriteData(updateOneLambda);
    userTable.grantReadWriteData(deleteOneLambda);

    budgetTable.grantReadWriteData(getAllLambda);
    budgetTable.grantReadWriteData(getOneLambda);
    budgetTable.grantReadWriteData(createOneLambda);
    budgetTable.grantReadWriteData(updateOneLambda);
    budgetTable.grantReadWriteData(deleteOneLambda);

    // Integrate the Lambda functions with the API Gateway resource
    const getAllIntegration = new LambdaIntegration(getAllLambda);
    const createOneIntegration = new LambdaIntegration(createOneLambda);
    const getOneIntegration = new LambdaIntegration(getOneLambda);
    const updateOneIntegration = new LambdaIntegration(updateOneLambda);
    const deleteOneIntegration = new LambdaIntegration(deleteOneLambda);

    // Create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, 'budgetsApi', {
      restApiName: 'Budgets Service'
    });

    const budgets = api.root.addResource('budgets');
    budgets.addMethod('GET', getAllIntegration);
    budgets.addMethod('POST', createOneIntegration);
    addCorsOptions(budgets);

    const singleBudget = budgets.addResource('{id}');
    singleBudget.addMethod('GET', getOneIntegration);
    singleBudget.addMethod('PATCH', updateOneIntegration);
    singleBudget.addMethod('DELETE', deleteOneIntegration);
    addCorsOptions(singleBudget);
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
