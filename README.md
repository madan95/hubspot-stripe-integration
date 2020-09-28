# Hubspot stripe integration

Simple example of using hubspot (hubdb api, serverless functions) and stripe api to integrate stripe payement to hubspot. Along with some helper utils to make hubdb v2 api easier to use.

## Getting Started

Once you have the clone of the repo. Install the dependencies `yarn`, then run `yarn watch` to make changes on the serverless functions.

Project Summary : 
    src 
        - serverless-functions
            - [filename].js (serverless functions)
            - serverless.json (config for serverless functions along with `env` keys)
    custom-theme (hubspot custom theme)
        - functions (compile serverless functions & config json)

You can integrate it with your own hubspot `custom-theme`, and add the required `env` variables in your project.

## Built with

- node
- hubspot (hubdb api v2)
- stripe

## Versioning

We use [SemVer](https://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/madan95/dockerTemple/tags)

## Author

- Madan
