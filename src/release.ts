import { RequestError } from '@octokit/request-error'
import * as github from '@actions/github'
import {
    Endpoints,
    GetResponseDataTypeFromEndpointMethod,
    OctokitResponse
} from '@octokit/types'

type Octokit = ReturnType<typeof github.getOctokit>
type GetRefParameterType =
    Endpoints['GET /repos/{owner}/{repo}/git/ref/{ref}']['parameters']
type CreateReleaseParameterType =
    Endpoints['POST /repos/{owner}/{repo}/releases']['parameters']
type CreateRefParameterType =
    Endpoints['POST /repos/{owner}/{repo}/git/refs']['parameters']
type UpdateRefParameterType =
    Endpoints['PATCH /repos/{owner}/{repo}/git/refs/{ref}']['parameters']
interface UpdateLatestResponseType {
    ref: string
    url: string
}

export async function createRelease(
    octokit: Octokit,
    owner: string,
    repo: string,
    release_name: string,
    release_description: string,
    release_version: string
): Promise<string> {
    type CreateReleaseResponseDataType = GetResponseDataTypeFromEndpointMethod<
        typeof octokit.rest.repos.createRelease
    >
    const release: OctokitResponse<CreateReleaseResponseDataType> =
        await octokit.rest.repos.createRelease({
            owner: owner,
            repo: repo,
            tag_name: release_version,
            name: release_name,
            body: release_description,
            draft: false,
            prerelease: false,
            generate_release_notes: true
        } satisfies CreateReleaseParameterType)
    return release.data.id.toString()
}

async function hasLatest(
    octokit: Octokit,
    owner: string,
    repo: string
): Promise<boolean> {
    try {
        await octokit.rest.git.getRef({
            owner: owner,
            repo: repo,
            ref: 'tags/latest'
        } satisfies GetRefParameterType)
        return true
    } catch (error) {
        if (error instanceof RequestError && error.status === 404) {
            return false
        } else {
            throw error
        }
    }
}

export async function updateLatest(
    octokit: Octokit,
    owner: string,
    repo: string,
    sha: string
): Promise<UpdateLatestResponseType> {
    type UpdateRefResponseType = GetResponseDataTypeFromEndpointMethod<
        typeof octokit.rest.git.updateRef
    >
    let latest: OctokitResponse<UpdateRefResponseType>

    if (await hasLatest(octokit, owner, repo)) {
        latest = await octokit.rest.git.updateRef({
            owner: owner,
            repo: repo,
            ref: 'tags/latest',
            sha: sha
        } satisfies UpdateRefParameterType)
    } else {
        latest = await octokit.rest.git.createRef({
            owner: owner,
            repo: repo,
            ref: 'refs/tags/latest',
            sha: sha
        } satisfies CreateRefParameterType)
    }
    return {
        ref: latest.data.ref,
        url: latest.data.url
    } satisfies UpdateLatestResponseType
}
