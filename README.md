# Messaging Work Queue Mission for Node.js

## Purpose

This mission booster demonstrates how to dispatch tasks to a scalable
set of worker processes using a message queue. It uses the AMQP 1.0
message protocol to send and receive messages.

## Prerequisites

* The user has access to an OpenShift instance and is logged in.

* The user has selected a project in which the frontend and backend
  processes will be deployed.

## Local Development

Requires:

* Node.js 10+
* npm 6+

Run the following commands from the *frontend/* directory in this repository:

```
npm i
npm run start:dev
```

You can now access the application on http://localhost:8080

## Build an Image

[source-to-image (s2i)](https://docs.okd.io/latest/creating_images/s2i.html) is
used to generate builds.

The commands are as follows once you have Docker and s2i installed:

```bash
export CONTAINER_NAME=rhmi-lab-nodejs-order-ui
docker pull registry.access.redhat.com/ubi8/nodejs-10
s2i build . --context-dir=frontend/ registry.access.redhat.com/ubi8/nodejs-10 $CONTAINER_NAME
```

## Authenticating Requests via 3Scale Shared Secret

Start the application with a 3scale secret supplied via the environment, e.g: 

```bash
THREESCALE_SECRET=secret npm run start:dev
```

Using cURL (or similar HTTP tool) make a request like so:

```bash
curl -X POST \
-H "x-3scale-proxy-secret-token:secret" \
-H "content-type:application/json" \
--data '{"product":"engine", "quantity":1}' \
http://localhost:8080/api/order/ --verbose
```

Take note of the returned `Set-Cookie` header. It will contain a session
similar to this `connect.sid=s%3AWJdsS.ewLV4W1GBb9i`. You can use this to fetch
your orders like so:

```bash
curl -H "x-3scale-proxy-secret-token:secret" \
--cookie "connect.sid=s%3AWJdsS.ewLV4W1GBb9i" \
http://localhost:8080/api/order/history --verbose
```

## Applying Keycloak / Red Hat SSO Protection

Start the server with the `KEYCLOAK_CONFIG` environment variable set to a valid
JSON Object containing a Keycloak configuration. For example:

```
# You can get this from a client in keycloak
export KEYCLOAK_CONFIG='{"realm":"master","auth-server-url":"http://localhost:9090/auth","ssl-required":"external","resource":"orders-app","public-client":true,"confidential-port":0}'

# The server will automatically apply keycloak middleware using KEYCLOAK_CONFIG
npm run start:dev
```

