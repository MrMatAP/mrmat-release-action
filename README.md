# MrMat Release Action

[![Build](https://github.com/MrMatAP/mrmat-release-action/actions/workflows/ci.yml/badge.svg)](https://github.com/MrMatAP/mrmat-release-action/actions/workflows/ci.yml)

A GitHub Action to release a new version of a project.

## Inputs

### github_token

**Required** Token to use for GitHub API requests.

### release_name

**Required** Name of the release.

### release_description

A description of the release.

### release_version

**Required** Version of the release.

### update_latest

Whether to create or shift the 'latest' tag.

## Outputs

### id

The created release ID.

## Example usage

```yaml
uses: actions/mrmat-release-action@latest
with:
    github_token: sample-token
    release_name: Sample Release
    release_description: Sample release description
    release_version: v1.0.0
    update_latest: true
```

## How to build this

Run `npm install` and then `npm run bundle`.

## How to test this

### Running the action locally

> Running this action locally would require a GitHub token to be injected, so
> this does not currently work.

Create `.env` based on `.env.example`, but do not commit it to your repo. Set
values in that file to simulate execution within a GitHub Workflow and execute
`npx @github/local-action . src/main.ts .env`.
