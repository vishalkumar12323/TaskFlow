import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

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
        userData.addCommands(
            '#!/bin/bash',
            'echo "User Data script started" > /var/log/user-data.log',
            'sudo apt update',
        );

        // const amit = ec2.MachineImage.

    }
}
