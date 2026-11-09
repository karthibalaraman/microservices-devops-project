pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        AWS_REGION = 'ap-south-1'
        // Set this to the PUBLIC IPv4 address of the APPLICATION EC2, not Jenkins EC2.
        APP_HOST = '13.200.10.254'
        APP_USER = 'ubuntu'
        DEPLOY_DIR = '/opt/microservices'

        ECR_USER_REPO = 'microservices-devops-user'
        ECR_PRODUCT_REPO = 'microservices-devops-product'
        ECR_ORDER_REPO = 'microservices-devops-order'

        SSH_CREDENTIAL_ID = 'app-ec2-ssh'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh '''
                    set -eu
                    test -f user-service/Dockerfile
                    test -f product-service/Dockerfile
                    test -f order-service/Dockerfile
                    test -f docker-compose.yml
                    test -f docker-compose.ecr.yml
                    test -f nginx/nginx.conf
                    test -f nginx/html/index.html
                    test -f scripts/smoke-test.sh
                '''
            }
        }

        stage('Validate Compose') {
            steps {
                sh '''
                    set -eu
                    docker compose -f docker-compose.yml config -q
                    USER_IMAGE=example.invalid/user:test                     PRODUCT_IMAGE=example.invalid/product:test                     ORDER_IMAGE=example.invalid/order:test                     docker compose -f docker-compose.ecr.yml config -q
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    set -eu
                    docker build -t user-service:${BUILD_NUMBER} ./user-service
                    docker build -t product-service:${BUILD_NUMBER} ./product-service
                    docker build -t order-service:${BUILD_NUMBER} ./order-service
                '''
            }
        }

        stage('Test Application') {
            steps {
                sh '''
                    set -eu
                    PROJECT="microservices-ci-${BUILD_NUMBER}"
                    cleanup() {
                        docker compose -p "$PROJECT" -f docker-compose.yml down || true
                    }
                    trap cleanup EXIT

                    docker compose -p "$PROJECT" -f docker-compose.yml up -d

                    attempt=0
                    until curl --fail --silent http://127.0.0.1/health >/dev/null; do
                        attempt=$((attempt + 1))
                        if [ "$attempt" -ge 18 ]; then
                            docker compose -p "$PROJECT" -f docker-compose.yml ps
                            docker compose -p "$PROJECT" -f docker-compose.yml logs --no-color
                            exit 1
                        fi
                        sleep 5
                    done

                    bash scripts/smoke-test.sh http://127.0.0.1
                '''
            }
        }

        stage('Prepare ECR') {
            steps {
                script {
                    env.AWS_ACCOUNT_ID = sh(
                        script: 'aws sts get-caller-identity --query Account --output text',
                        returnStdout: true
                    ).trim()

                    if (!(env.AWS_ACCOUNT_ID ==~ /^[0-9]{12}$/)) {
                        error('Could not determine a valid AWS account ID. Check the Jenkins EC2 IAM role.')
                    }

                    env.ECR_REGISTRY = "${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com"
                    env.USER_IMAGE = "${env.ECR_REGISTRY}/${env.ECR_USER_REPO}:${env.BUILD_NUMBER}"
                    env.PRODUCT_IMAGE = "${env.ECR_REGISTRY}/${env.ECR_PRODUCT_REPO}:${env.BUILD_NUMBER}"
                    env.ORDER_IMAGE = "${env.ECR_REGISTRY}/${env.ECR_ORDER_REPO}:${env.BUILD_NUMBER}"
                }

                sh '''
                    set -eu
                    aws ecr get-login-password --region "$AWS_REGION" |
                      docker login --username AWS --password-stdin "$ECR_REGISTRY"
                '''
            }
        }

        stage('Push Images to ECR') {
            steps {
                sh '''
                    set -eu
                    docker tag user-service:${BUILD_NUMBER} "$USER_IMAGE"
                    docker tag product-service:${BUILD_NUMBER} "$PRODUCT_IMAGE"
                    docker tag order-service:${BUILD_NUMBER} "$ORDER_IMAGE"
                    docker push "$USER_IMAGE"
                    docker push "$PRODUCT_IMAGE"
                    docker push "$ORDER_IMAGE"
                '''
            }
        }

        stage('Prepare Application EC2') {
            steps {
                script {
                    if (env.APP_HOST == 'REPLACE_WITH_APPLICATION_EC2_PUBLIC_IP' ||
                        !(env.APP_HOST ==~ /^[0-9.]+$/)) {
                        error('Set APP_HOST in the Jenkinsfile to the application EC2 public IPv4 address.')
                    }
                }

                sshagent(credentials: [env.SSH_CREDENTIAL_ID]) {
                    sh '''
                        set -eu
                        mkdir -p "$HOME/.ssh"
                        chmod 700 "$HOME/.ssh"
                        ssh-keyscan -H "$APP_HOST" >> "$HOME/.ssh/known_hosts"

                        ssh "$APP_USER@$APP_HOST"                           "sudo mkdir -p '$DEPLOY_DIR/html' &&
                           sudo chown -R '$APP_USER:$APP_USER' '$DEPLOY_DIR'"

                        scp docker-compose.ecr.yml                           "$APP_USER@$APP_HOST:$DEPLOY_DIR/docker-compose.yml"
                        scp nginx/nginx.conf                           "$APP_USER@$APP_HOST:$DEPLOY_DIR/nginx.conf"
                        scp nginx/html/index.html                           "$APP_USER@$APP_HOST:$DEPLOY_DIR/html/index.html"
                    '''
                }
            }
        }

        stage('Deploy to Application EC2') {
            steps {
                sshagent(credentials: [env.SSH_CREDENTIAL_ID]) {
                    sh '''
                        set -eu
                        ssh "$APP_USER@$APP_HOST" "
                          set -eu
                          cd '$DEPLOY_DIR'

                          aws ecr get-login-password --region '$AWS_REGION' |
                            docker login --username AWS --password-stdin '$ECR_REGISTRY'

                          export USER_IMAGE='$USER_IMAGE'
                          export PRODUCT_IMAGE='$PRODUCT_IMAGE'
                          export ORDER_IMAGE='$ORDER_IMAGE'

                          docker compose -f docker-compose.yml config -q
                          docker compose -f docker-compose.yml pull
                          docker compose -f docker-compose.yml up -d --remove-orphans
                          docker compose -f docker-compose.yml ps
                        "
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -eu
                    BASE_URL="http://${APP_HOST}"
                    curl --fail --silent --show-error --retry 12 --retry-delay 5 "$BASE_URL/health"
                    echo
                    curl --fail --silent --show-error --retry 12 --retry-delay 5 "$BASE_URL/users/health"
                    echo
                    curl --fail --silent --show-error --retry 12 --retry-delay 5 "$BASE_URL/products/health"
                    echo
                    curl --fail --silent --show-error --retry 12 --retry-delay 5 "$BASE_URL/orders/health"
                    echo
                    echo "All three microservices and Nginx are responding."
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: All three microservices were built, pushed to ECR, deployed and verified.'
        }
        failure {
            echo 'FAILED: Open Console Output and identify the first failed stage.'
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
