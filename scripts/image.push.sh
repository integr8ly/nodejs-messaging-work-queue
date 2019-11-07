QUAY_USER=${QUAY_USER:-evanshortiss}
docker tag rhmi-lab-nodejs-order-frontend quay.io/$QUAY_USER/rhmi-lab-nodejs-order-frontend:latest
docker push quay.io/$QUAY_USER/rhmi-lab-nodejs-order-frontend:latest
