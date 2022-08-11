#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { MercuryPipelineStack } from '../lib/mercury-pipeline-stack';

const app = new App();
new MercuryPipelineStack(app, 'MercuryPipelineStack', {
  env: { account: '905812565527', region: 'us-east-2' },
});

app.synth();