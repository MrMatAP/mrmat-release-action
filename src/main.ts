import * as core from '@actions/core'
import * as github from '@actions/github'
import type { components } from '@octokit/openapi-types'

type Release = components['schemas']['release']

export async function run(): Promise<void> {
    try {
        const github_token: string = core.getInput('github_token')
        const release_name: string = core.getInput('release_name')
        const release_description: string = core.getInput('release_description')
        const release_version: string = core.getInput('release_version')
        const update_latest: string = core.getInput('update_latest')

        const gh = github.getOctokit(github_token)

        //
        // Create the new release

        const resp = await gh.rest.repos.createRelease({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            tag_name: release_version,
            name: release_name,
            body: release_description,
            draft: false,
            prerelease: false,
            generate_release_notes: true
        })
        const { id: releaseId, target_commitish: release_commit } =
            resp.data as Release

        //
        // Shift the latest tag if requested

        if (update_latest === 'true') {
            // const resp = await gh.rest.repos.listTags({
            //     owner: github.context.repo.owner,
            //     repo: github.context.repo.repo
            // })
            //const filtered_tags= resp.data.filter(tag => tag.name === 'latest')
            //if (filtered_tags.length === 0) {
            //}

            const resp = await gh.rest.git.createTag({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                tag: 'latest',
                message: 'Latest release',
                object: github.context.sha,
                type: 'commit'
            })
            if (resp.status !== 201) {
                core.setFailed('Failed to create/update latest tag')
            }
            core.info(
                `Created/updated latest tag to point to ${release_commit}`
            )
        }

        core.setOutput('id', releaseId.toString())
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message)
        }
        core.error(error as string)
    }
}
