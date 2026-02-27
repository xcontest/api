# Contributing to xContest

Thank you for your interest in contributing! To maintain a high standard of code quality and a clean project history, we enforce the following guidelines.

---
## Development Environment

This project requires **pnpm** for package management.

To set up your development environment, first clone the repository:
```shell
git clone https://github.com/xcontest/api
```
Then, navigate to the project directory and install dependencies:
```shell
pnpm install
```
And finally, create `.env` file based on `.env.example`.
Just copy the content of `.env.example` and paste it into `.env` file.
This will provide you with a mostly working configuration.
Although, features like mailer and oauth2 will require providing your own credentials.

> [!IMPORTANT]  
> Before continuing any further, please ensure you have [Docker](https://docs.docker.com/get-docker/) installed on your machine.

There are two main ways of developing the project, depending on your needs and preferences:
### Full Docker setup:
Our app supports HMR inside a docker container for development.
To run everything inside the container, all you need to do is run the following command in the project root directory:
```shell
docker compose --profile dev up -d
```
Provided you have followed all steps correctly,
you should be able to access the app at `http://localhost:3333`.

### Docker for services only:
If you prefer running the app manually, you can use docker to run only the services required for development.
Those services include: PostgreSQL, SeaweedFS, and Redis.
To do so, run the following command:
```shell
docker compose --profile base up -d
```
This will start all required services in the background, and you can run the app manually using `pnpm dev` command.
This setup is also useful for running tests, as it will only require using `node ace test` command.

---
# Guidelines

Here are some guidelines to follow when contributing to the project. 
Those help us maintain a consistent code base and ensure a smooth development process.
Please note that code not following these guidelines will be rejected.

### Code Style
We enforce a consistent code style using our custom ESLint configuration.
Those rules are defined in [`eslint.config.js`](/eslint.config.js) file.
Please make sure your code follows these guidelines before submitting a Pull Request:
* Run `pnpm lint` for standard ESLint checks.
* Run `pnpm check` for full validation (ESLint + Semgrep).
*Note: You must have [Semgrep](https://semgrep.dev/) installed manually on your machine.*

Currently semgrep only checks for known common mistakes we have identified, like
using `bouncer.allows(...)` instead of `bouncer.authorize(...)`, which is a security risk.

### Testing
We use [Jest](https://jestjs.io/) for testing our application.
If contributing to the project, ensure all tests pass before submitting a Pull Request.
If tests fail, your PR will automatically be blocked from merging.

* Execute the test suite via `pnpm test` or `node ace test`.

As all our tests are e2e, you need to have all required services running in the background while running the tests.
For instructions on how to set up the required services,
please refer to the [Docker services setup](#docker-for-services-only) section above.

### Ensure production build works
Ensure that the production build of the app works correctly.
This can be done by either running `pnpm build` or `docker build -t xcontest-rest .`.

---

## Git Workflow & History Policy

We strictly enforce a **Linear Git History**. This makes the project history easier to follow, bisect, and audit.
Other rules related to this policy include:

### Preferred Rebasing
We prefer using full rebasing over squashing or merging.
This makes the history more readable and easier to follow.

Rebasing means putting all your commits on top of the latest `main` branch.
This ensures more granular commits and a clean history.
It also makes it easier to resolve conflicts.

To rebase your branch, use the following command:
```bash
git checkout your-branch
git fetch origin
git rebase origin/main`
```

If there are no conflicts, this will be a fast-forward merge, and your branch will be up to date with the latest `main`.
If, however, there are conflicts, you will be prompted to resolve them locally for every commit.
After resolving the conflicts, you can continue the rebase process by using:
```bash
git rebase --continue
```

If you have any issues with rebasing, please reach out to us via the PR comment.

### Mandatory Signed Commits
> [!IMPORTANT] 
> We require all commits to be signed.
This ensures that the committer is the author of the change,
and that the commit is properly attributed to the author.

For more information on how to set up commit signing, please refer to the [Github Documentation](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).

---

## Submission Requirements

All pull requests must meet the following requirements before they can be merged:

- **Review:** All code must be reviewed and approved by at least one maintainer.
- **Green CI:** All automated checks must pass, including:
 - * Code quality (Linting/Semgrep).
 - * Functional tests.
 - * Successful Docker build.
- **Linear History:** The branch must be a clean, linear set of commits on top of the current `main`.
- **Signed Commits:** All commits must be signed.

---

## Code of Conduct

By participating in this project, you agree to maintain a professional and respectful environment for all contributors.

**Thank you for helping us build something great!**
