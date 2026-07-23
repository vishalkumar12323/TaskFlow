#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ComputeStack } from '../lib/compute-stack';

const app = new cdk.App();

// Environment — required for SSM parameter lookups and AMI resolution
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// ─── Stack 1: Network ────────────────────────────────────────────────────────
const networkStack = new NetworkStack(app, 'TaskFlow-NetworkStack', {
  env,
  description: 'TaskFlow — VPC, subnets, and networking resources',
});

// ─── Stack 2: Database ───────────────────────────────────────────────────────
const databaseStack = new DatabaseStack(app, 'TaskFlow-DatabaseStack', {
  env,
  vpc: networkStack.vpc,
  description: 'TaskFlow — Database security group and SSM configuration',
});

// ─── Stack 3: Compute ────────────────────────────────────────────────────────
const computeStack = new ComputeStack(app, 'TaskFlow-ComputeStack', {
  env,
  vpc: networkStack.vpc,
  dbSecurityGroup: databaseStack.dbSecurityGroup,
  description: 'TaskFlow — EC2 instance, Elastic IP, and IAM role',
});

// Explicit dependency ordering
databaseStack.addDependency(networkStack);
computeStack.addDependency(databaseStack);
