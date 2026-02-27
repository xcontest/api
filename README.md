# xContest REST API
![Build Action Workflow Status](https://img.shields.io/github/actions/workflow/status/xcontest/api/docker_build.yml)
![Test Action Workflow Status](https://img.shields.io/github/actions/workflow/status/xcontest/api/api_testing.yml?label=tests)
![GitHub commit activity](https://img.shields.io/github/commit-activity/w/xcontest/api)
![GitHub Repo stars](https://img.shields.io/github/stars/xcontest/api?style=flat)
![GitHub License](https://img.shields.io/github/license/xcontest/api)

---
## Project Overview
The xContest REST API is designed to provide a standardized interface for accessing and manipulating data related to the xContest project. 
It is used by various other components like the xContest web application and the xContest CLI.
The API is built using Node.JS and AdonisJS framework.
It also contains a set of custom tools like OpenAPI documentation generator and builtin UI for the generated spec.

---
## Features
This component is still under active development and does not yet contain all the features planned for the final project.
At this moment we focus heavily on the hackathon functionality, but it is planned to include other features
for algorithmic competitions with automated evaluation and CTFs as well.

At the moment features supported by the API are:
- User authentication and authorization via email and password or OAuth2,
- Creation and management of events,
- Creation and management of hackathon-related tasks,
- Creation and management participant teams,
- Submission and evaluation of hackathon tasks,

More features will be added in the future.

---
## Running the API
Recommended, and the easiest way to run the API is using Docker.
You can use the provided `docker-compose.yml` file to set up the necessary services, including the database and the API itself.

Before running the API, you will need to create a `.env` file in the project root directory and fill it with the necessary environment variables.
The `.env.example` file contains all the necessary variables and their example values.
Please replace the values with your own.

To run the API this way you will need to have [Docker](https://www.docker.com/get-started/) installed on your machine.
After that, running the project is as simple as executing the following command in the project root directory:
```shell
docker compose --profile <profile> up -d
```
Where `<profile>` is the name of the profile you want to run. Currently available profiles are:
- `prod` - for production environment.
- `dev` - for development environment (with HMR),
- `base` - starts only required services (database, object storage, redis)

Production and development profiles will run everything needed to run the API.

To stop the API and all related services, you can use the following command:
```shell
docker compose --profile <profile> down
```
Stopping the API this way will preserve the data stored in the database and object storage, 
so you can safely stop and start the API without losing any data.

If, however, you want to shut everything down and start over, you can add the `-v` flag to the end of `down` command.
This will permanently remove all the data stored in the database and object storage.

---
# License
This project is licensed under [AGPLv3.0](/LICENSE.md).
For more information, please refer to <https://www.gnu.org/licenses/agpl-3.0.html>.

---
## Maintainers & Contact

The core team responsible for the strategic direction and maintenance of the project.

| [<img src="https://github.com/InfoX1337.png?size=100" width="100px;"/><br /><sub><b>@InfoX1337</b></sub>](https://github.com/InfoX1337)<br />Developer | [<img src="https://github.com/olix3001.png?size=100" width="100px;"/><br /><sub><b>@olix3001</b></sub>](https://github.com/olix3001)<br />Developer | [<img src="https://github.com/InfoTCube.png?size=100" width="100px;"/><br /><sub><b>@InfoTCube</b></sub>](https://github.com/InfoTCube)<br />Developer |
|:------------------------------------------------------------------------------------------------------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------------------------------------------------------------------:|

If you find any issues or have any questions, please feel free to reach out to us on [GitHub](https://github.com/xcontest/api/issues).
We are always happy to help!

If you are interested in using our project for your events and
need some help setting it up, please reach out to us privately (contact info will be provided in the near future).

---
## Contributors
Thank you to all the contributors who have helped make this project possible!
We greatly appreciate your help! :heart:
If you would like to contribute to this project, please see our [contributing guidelines](CONTRIBUTING.md).

<a href="https://github.com/xcontest/api/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=xcontest/api" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
