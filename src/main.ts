import * as core from '@actions/core'
import * as github from '@actions/github'
import { RequestError } from '@octokit/request-error'
import { createRelease, updateLatestRelease } from './release.js'

export async function run(): Promise<void> {
    try {
        const githubToken: string = core.getInput('github_token')
        const releaseName: string = core.getInput('release_name')
        const releaseDescription: string = core.getInput('release_description')
        const releaseVersion: string = core.getInput('release_version')
        const updateLatest: string = core.getInput('update_latest')

        const octokit = github.getOctokit(githubToken)

        const releaseId = await createRelease(
            octokit,
            github.context.repo.owner,
            github.context.repo.repo,
            releaseName,
            releaseDescription,
            releaseVersion
        )
        core.info(`Created release id ${releaseId}`)
        core.setOutput('release_id', releaseId)

        if (updateLatest === 'true') {
            const latest = await updateLatestRelease(
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
