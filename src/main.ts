import * as core from '@actions/core'
import * as github from '@actions/github'
import { RequestError } from '@octokit/request-error'
import { createRelease, updateLatest } from './release.js'

export async function run(): Promise<void> {
    try {
        const github_token: string = core.getInput('github_token')
        const release_name: string = core.getInput('release_name')
        const release_description: string = core.getInput('release_description')
        const release_version: string = core.getInput('release_version')
        const update_latest: string = core.getInput('update_latest')

        const octokit = github.getOctokit(github_token)

        const releaseId = await createRelease(
            octokit,
            github.context.repo.owner,
            github.context.repo.repo,
            release_name,
            release_description,
            release_version
        )
        core.info(`Created release id ${releaseId}`)
        core.setOutput('release_id', releaseId)

        if (update_latest === 'true') {
            const latest = await updateLatest(
                octokit,
                github.context.repo.owner,
                github.context.repo.repo,
                github.context.sha
            )
            core.info(
                `Updated latest ref ${latest.ref} to point to ${github.context.sha}`
            )
            core.setOutput('latest_url', latest.url)
        } else {
            core.setOutput('latest_url', '')
        }
    } catch (error) {
        if (error instanceof RequestError) {
            core.setFailed(`[${error.status}] ${error.message}`)
        } else {
            core.setFailed(error as string)
        }
    }
}
