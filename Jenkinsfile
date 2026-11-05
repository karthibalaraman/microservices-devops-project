pipeline {

    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        AWS_REGION = 'ap-south-1'
        AWS_ACCOUNT_ID = 'YOUR_AWS_ACCOUNT_ID'

        ECR_USER = 'user-service'
        ECR_PRODUCT = 'product-service'
        ECR_ORDER = 'order-service'

        EC2_HOST = 'YOUR_EC2_PUBLIC_IP'
        EC2_USER = 'ubuntu'
        DEPLOY_DIR = '/opt/microservices'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate') {
            steps {
                sh '''
                    docker compose config
                    test -f user-service/Dockerfile
                    test -f product-service/Dockerfile
                    test -f order-service/Dockerfile
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    docker build -t user-service:${BUILD_NUMBER} ./user-service

                    docker build -t product-service:${BUILD_NUMBER} ./product-service

                    docker build -t order-service:${BUILD_NUMBER} ./order-service
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                    # Add the existing application test commands here.
                    # Do not invent tests or modify application features.
                    echo "Run project-provided tests"
                '''
            }
        }

        stage('ECR Login') {
            steps {
                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-ecr-push'
                    ]
                ]) {
                    sh '''
                        aws ecr get-login-password \
                          --region $AWS_REGION |
                        docker login \
                          --username AWS \
                          --password-stdin \
                          $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                    '''
                }
            }
        }

        stage('Tag and Push') {
            steps {
                sh '''
                    REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

                    docker tag user-service:${BUILD_NUMBER} \
                      $REGISTRY/user-service:${BUILD_NUMBER}

                    docker tag product-service:${BUILD_NUMBER} \
                      $REGISTRY/product-service:${BUILD_NUMBER}

                    docker tag order-service:${BUILD_NUMBER} \
                      $REGISTRY/order-service:${BUILD_NUMBER}

                    docker push $REGISTRY/user-service:${BUILD_NUMBER}

                    docker push $REGISTRY/product-service:${BUILD_NUMBER}

                    docker push $REGISTRY/order-service:${BUILD_NUMBER}
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=yes \
                          $EC2_USER@$EC2_HOST \
                          "mkdir -p $DEPLOY_DIR"
                    '''

                    // Deployment scripts and configuration must
                    // already be available in the EC2 directory.
                    sh '''
                        scp deploy-compose.yml nginx.conf \
                          $EC2_USER@$EC2_HOST:$DEPLOY_DIR/
                    '''

                    sh '''
                        ssh $EC2_USER@$EC2_HOST "
                          cd $DEPLOY_DIR &&
                          export BUILD_NUMBER=${BUILD_NUMBER} &&
                          ./deploy.sh
                        "
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    curl --fail --retry 5 --retry-delay 5 \
                      http://$EC2_HOST/
                '''
            }
        }
    }

    post {
        success {
            echo 'Deployment completed successfully'
        }

        failure {
            echo 'Pipeline failed. Check Jenkins console logs.'
        }

        always {
            echo 'Pipeline execution finished'
        }
    }
}