#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MercuryServerlessStack } from '../lib/mercury-serverless-stack';

const app = new cdk.App();
new MercuryServerlessStack(app, 'MercuryServerlessStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

app.synth();