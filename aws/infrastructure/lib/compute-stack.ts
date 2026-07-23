import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  dbSecurityGroup: ec2.SecurityGroup;
}

export class ComputeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;
    const keyPairName = this.node.tryGetContext('keyPairName') || 'SSH-LOOKUP';

    // ─── Security Group ────────────────────────────────────────────────
    const securityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'TaskFlow EC2 — allows SSH, HTTP, and HTTPS inbound',
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH from anywhere',
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere',
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere',
    );

    // ─── IAM Role ──────────────────────────────────────────────────────
    // Grants the EC2 instance permission to read SSM parameters (for DB
    // config) and write CloudWatch Logs (for monitoring).
    const role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'TaskFlow EC2 instance role — SSM params + CloudWatch Logs',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ssm:GetParameter', 'ssm:GetParameters'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/taskflow/*`,
      ],
    }));

    // ─── Key Pair ──────────────────────────────────────────────────────
    const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', keyPairName);

    // ─── Elastic IP ────────────────────────────────────────────────────
    // Allocated before the instance so we can inject the IP into user data.
    const eip = new ec2.CfnEIP(this, 'TaskFlowEip', {
      domain: 'vpc',
      tags: [{ key: 'Name', value: 'TaskFlow-EIP' }],
    });

    // ─── User Data ─────────────────────────────────────────────────────
    const userData = ec2.UserData.forLinux();

    // Inject the Elastic IP into the boot script as an env var.
    // CDK resolves eip.attrPublicIp → CloudFormation Fn::GetAtt at deploy time,
    // so the actual IP is baked into user data before the instance boots.
    userData.addCommands(`export TASKFLOW_EIP="${eip.attrPublicIp}"`);

    const setupScript = fs.readFileSync(
      path.join(__dirname, '../../setup.sh'), 'utf-8',
    );
    userData.addCommands(setupScript);

    // ─── AMI ───────────────────────────────────────────────────────────
    const ubuntuAmi = ec2.MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id',
    );

    // ─── EC2 Instance ──────────────────────────────────────────────────
    const instance = new ec2.Instance(this, 'TaskFlowEc2', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: ubuntuAmi,
      securityGroup,
      userData,
      role,
      keyPair,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
    });

    // Attach the database security group (restricts port 5432 to VPC-only)
    instance.addSecurityGroup(props.dbSecurityGroup);

    // ─── EIP Association ───────────────────────────────────────────────
    new ec2.CfnEIPAssociation(this, 'EipAssociation', {
      allocationId: eip.attrAllocationId,
      instanceId: instance.instanceId,
    });

    // ─── Outputs ───────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'TaskFlow EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'ElasticIp', {
      value: eip.attrPublicIp,
      description: 'TaskFlow Elastic IP — use this to access your app',
    });

    new cdk.CfnOutput(this, 'SshCommand', {
      value: `ssh -i ${keyPairName}.pem ubuntu@` + eip.attrPublicIp,
      description: 'SSH command to connect to the instance',
    });

    cdk.Tags.of(this).add('Project', 'TaskFlowFullStackApp');
  }
}
