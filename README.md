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

## Deployment

Run the following commands to configure and deploy the applications.

```bash
$ oc create -f service.amqp.yaml

$ ./start-openshift
```
## Modules

The `frontend` module serves the web interface and communicates with
workers in the backend.
