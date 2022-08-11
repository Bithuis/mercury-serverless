import * as cdk from 'aws-cdk-lib';
import { ManualApprovalAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { CodePipeline, CodePipelineSource, ManualApprovalStep, ShellStep, Step } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { MercuryPipelineStage } from './mercury-pipeline-stage';

export class MercuryPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const pipeline = new CodePipeline(this, 'MercuryServerlessPipeline', {
            pipelineName: 'MercuryServerlessPipeline',
            synth: new ShellStep('Synth', {
                input: CodePipelineSource.gitHub('Bithuis/mercury-serverless', 'main'), // Token stored in Secrets Manager
                commands: [
                    'npm ci',
                    'npm run build',
                    'npx cdk synth',
                ]
            })
        });

        const testStage = pipeline.addStage(new MercuryPipelineStage(this, 'test', {
            env: { account: '905812565527', region: 'us-east-2' },
        }));

        testStage.addPost(new ManualApprovalStep('Manual Approval before production'));

        const prodStage = pipeline.addStage(new MercuryPipelineStage(this, 'prod', {
            env: { account: '905812565527', region: 'us-east-1' },
        }));
    }
}
