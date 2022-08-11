import * as cdk from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep, Step } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';

export class MercuryServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new CodePipeline(this, 'MercuryServerlessPipeline', {
      pipelineName: 'MercuryServerlessPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('Bithuis/mercury-serverless', 'main'),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ]
      })
    });
  }
}
