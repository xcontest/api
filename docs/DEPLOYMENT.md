# Deployment of xContest app
This guideline is intended to provide a comprehensive overview of the deployment process for the xContest platform. 
It covers full deployment including required infrastructure, api, frontend, and other components.

There are multiple ways to deploy the xContest platform:
- [Deploying on Docker](#deploying-on-docker)
- [Deploying on Docker Swarm](#deploying-on-docker-swarm) (not ready yet)
- [Deploying on Kubernetes](#deploying-on-kubernetes) (not ready yet)
- [Deploying Manually](#deploying-manually)

---
# Deploying on Docker
This is the easiest and recommended way to deploy the xContest platform.
It requires minimal manual intervention and provides a seamless deployment process.

Although easily enough for small-scale events and local development,
it is not recommended for huge events with thousands of participants, as it does not provide the necessary scalability and reliability.
For such events, we recommend using Kubernetes or Docker Swarm.

To deploy the xContest platform on Docker, set up some server or VPS with Docker installed, and run the following command in the project root directory:
```shell
# TODO: Update once we have global docker compose profiles with frontend, etc...
docker compose --profile prod up -d
```
As this will run the entire stack, it is recommended your server has sufficient resources to handle more than just the base platform load.

For guide on how to set up Docker, please refer to the official [Docker documentation](https://docs.docker.com/get-started/).

If you do not want to compile the project yourself, pre-built images are available on our [Github Actions](https://github.com/xcontest/api/actions/workflows/docker_build.yml).

---
# Deploying on Docker Swarm
This method is more complex than standard Docker,
it provides better scalability and reliability, making it suitable for larger events with more participants.
This method requires multiple machines to be set up,
and it is not recommended for local development.

**Not ready yet:** Docker Swarm does not allow profiles and locally built images are not available.
Due to this, we do not support Docker Swarm deployment at the moment.
It will be available in the future, once xContest reaches a stable version.

---
# Deploying on Kubernetes
This method is way more complex than those above,
as it requires setting up a whole Kubernetes cluster.
It is only recommended for huge-scale deployments that will require
handling multiple huge events at the same time.

**Not ready yet:** We will probably provide a helm chart for this in the future,
but at the moment Kubernetes deployment is not officially supported.
You can still use it, but you will need to create all the necessary manifests yourself.
It will be available in the future, once xContest reaches a stable version.

---
# Deploying Manually
Manual deployment is not recommended for most users,
as it requires a lot of manual work.

Due to required manual work and knowledge, this guide only
provides a brief overview of the deployment process and required services.

xContest requires the following third-party services:
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)
- [SeaweedFS](https://seaweedfs.com/)
- [RabbitMQ](https://www.rabbitmq.com/)
- Some SMTP server (for email notifications)

And the following xContest services:
- [xContest REST API](https://github.com/xcontest/api)
- [xContest Realtime API](https://github.com/xcontest/realtime-api) (for live updates and notifications on the website)
- [xContest Frontend](https://github.com/xcontest/web)
- [xContest Workers](https://www.rabbitmq.com/worker) (multiple, required only for algorithmic and CTF events)
