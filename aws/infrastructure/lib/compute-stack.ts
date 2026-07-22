import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface ComputeStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}

export class ComputeStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ComputeStackProps) {
        super(scope, id, props);

        // Use the VPC from NetworkStack
        const vpc = props.vpc;

        // Add your compute resources here using `vpc`
        const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
            vpc,
            allowAllOutbound: true,
            description: "Allows developers SSH access to EC2 Instance"
        });

        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(22),
            "Allow SSH from anywhere"
        );

        const userData = ec2.UserData.forLinux();
        const setupScriptPath = fs.readFileSync(path.join(__dirname, '../../setup.sh'), 'utf-8');
        userData.addCommands(setupScriptPath);

        const ubuntuAmi = ec2.MachineImage.fromSsmParameter('/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id');

        const ec2Instance = new ec2.Instance(this, 'TaskFlowEc2', {
            vpc,
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            machineImage: ubuntuAmi,
            securityGroup: securityGroup,
            userData: userData,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
                subnetGroupName: 'task-flow-public-subnet'
            }
        });
    }
}
