import { Stage, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MercuryServerlessStack } from './mercury-serverless-stack';

export class MercuryPipelineStage extends Stage {
    constructor(scope: Construct, stageName: string, props?: StackProps) {
        super(scope, stageName, props);

        const serverlessStack = new MercuryServerlessStack(this, 'MercuryServerlessStack', stageName);
    }
}