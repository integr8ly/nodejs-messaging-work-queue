QUAY_USER=${QUAY_USER:-integreatly}
TAG=${TAG:-latest}

docker tag rhmi-lab-nodejs-order-frontend quay.io/$QUAY_USER/rhmi-lab-nodejs-order-frontend:$TAG
docker push quay.io/$QUAY_USER/rhmi-lab-nodejs-order-frontend:$TAG
