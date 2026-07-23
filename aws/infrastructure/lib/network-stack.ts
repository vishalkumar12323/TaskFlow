import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'TaskFlowVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,

      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'task-flow-public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],

      // No NAT gateway needed — everything runs on a single EC2 in the public subnet
      natGateways: 0,
    });

    cdk.Tags.of(this.vpc).add('Project', 'TaskFlowFullStackApp');

    // ─── Outputs ───────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'TaskFlow VPC ID',
    });
  }
}
