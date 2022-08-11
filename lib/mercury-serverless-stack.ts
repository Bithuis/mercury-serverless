import { Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, Table, ProjectionType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';

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

    new Function(this, 'CreateUser', {
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler.handler',
      code: Code.fromAsset(path.join(__dirname, 'lambda/create-user')),
      environment: { "stageName": stageName }
    })
  }
}
