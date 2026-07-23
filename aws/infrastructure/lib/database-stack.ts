import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    // ─── Security Group ────────────────────────────────────────────────
    // Restricts PostgreSQL port access to VPC-internal traffic only.
    // Even though PostgreSQL runs locally on the EC2, this ensures
    // the port isn't exposed to the internet via the instance's ENI.
    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      allowAllOutbound: false,
      description: 'Allows PostgreSQL access only from within the VPC',
    });

    this.dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from within VPC',
    );

    cdk.Tags.of(this.dbSecurityGroup).add('Project', 'TaskFlowFullStackApp');

    // ─── SSM Parameter Store — Database Configuration ──────────────────
    // Free (standard tier). The EC2 user-data script reads these at boot
    // to configure the local PostgreSQL instance and backend .env file.
    const dbPassword = this.node.tryGetContext('dbPassword') || 'TaskFlow_Secure_P@ss1';
    const jwtSecret = this.node.tryGetContext('jwtSecret')
      || 'change-this-to-a-secure-random-string-at-least-32-chars-long!!';

    new ssm.StringParameter(this, 'DbName', {
      parameterName: '/taskflow/db/name',
      stringValue: 'taskdb',
      description: 'TaskFlow database name',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'DbUser', {
      parameterName: '/taskflow/db/user',
      stringValue: 'taskdbuser',
      description: 'TaskFlow database user',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'DbPassword', {
      parameterName: '/taskflow/db/password',
      stringValue: dbPassword,
      description: 'TaskFlow database password',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'JwtSecret', {
      parameterName: '/taskflow/jwt/secret',
      stringValue: jwtSecret,
      description: 'TaskFlow JWT signing secret',
      tier: ssm.ParameterTier.STANDARD,
    });

    // ─── Outputs ───────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'DbSecurityGroupId', {
      value: this.dbSecurityGroup.securityGroupId,
      description: 'Database Security Group ID',
    });
  }
}
