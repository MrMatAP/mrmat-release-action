import { jest } from '@jest/globals'
import { RequestError } from '@octokit/request-error'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)

const { run } = await import('../src/main.js')

type MockOctokit = ReturnType<typeof github.getOctokit>

const repo = { owner: 'MrMat', repo: 'test0' }
const sha = 'abc1234'

function mockInputs(updateLatest: boolean): void {
    core.getInput.mockImplementation((input: string) => {
        switch (input) {
            case 'github_token':
                return 'test-token'
            case 'release_name':
                return 'v1.0.0'
            case 'release_description':
                return 'Release description'
            case 'release_version':
                return 'v1.0.0'
            case 'update_latest':
                return updateLatest.toString()
            default:
                throw new Error(`Unexpected input: ${input}`)
        }
    })
}

describe('Release Tests', () => {
    beforeEach(() => {
        github.context.repo = repo
        github.context.sha = sha
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    test('creates a release without updating the latest tag', async () => {
        mockInputs(false)
        const createRelease = jest.fn().mockReturnValue({
            data: { id: 1, target_commitish: 'some-commit' }
        })
        github.getOctokit.mockReturnValue({
            rest: { repos: { createRelease } }
        } as unknown as MockOctokit)

        await run()

        expect(createRelease).toHaveBeenCalledWith({
            owner: repo.owner,
            repo: repo.repo,
            tag_name: 'v1.0.0',
            name: 'v1.0.0',
            body: 'Release description',
            draft: false,
            prerelease: false,
            generate_release_notes: true
        })
        expect(core.setOutput).toHaveBeenNthCalledWith(1, 'release_id', '1')
        expect(core.setOutput).toHaveBeenNthCalledWith(2, 'latest_url', '')
    })

    test('creates a release and updates an existing latest tag', async () => {
        mockInputs(true)
        const createRelease = jest.fn().mockReturnValue({
            data: { id: 2, target_commitish: 'some-commit' }
        })
        const getRef = jest.fn().mockReturnValue({ data: {} })
        const updateRef = jest.fn().mockReturnValue({
            data: {
                ref: 'refs/tags/latest',
                url: 'https://api.github.com/repos/MrMat/test0/git/refs/tags/latest'
            }
        })
        github.getOctokit.mockReturnValue({
            rest: {
                repos: { createRelease },
                git: { getRef, updateRef }
            }
        } as unknown as MockOctokit)

        await run()

        expect(getRef).toHaveBeenCalledWith({
            owner: repo.owner,
            repo: repo.repo,
            ref: 'tags/latest'
        })
        expect(updateRef).toHaveBeenCalledWith({
            owner: repo.owner,
            repo: repo.repo,
            ref: 'tags/latest',
            sha
        })
        expect(core.setOutput).toHaveBeenNthCalledWith(1, 'release_id', '2')
        expect(core.setOutput).toHaveBeenNthCalledWith(
            2,
            'latest_url',
            'https://api.github.com/repos/MrMat/test0/git/refs/tags/latest'
        )
    })

    test('creates a release and creates a new latest tag when none exists', async () => {
        mockInputs(true)
        const createRelease = jest.fn().mockReturnValue({
            data: { id: 3, target_commitish: 'some-commit' }
        })
        const notFound = new RequestError('Not Found', 404, {
            request: {
                method: 'GET',
                url: 'https://api.github.com',
                headers: {}
            }
        })
        const getRef = jest
            .fn()
            .mockImplementation(() => Promise.reject(notFound))
        const createRef = jest.fn().mockReturnValue({
            data: {
                ref: 'refs/tags/latest',
                url: 'https://api.github.com/repos/MrMat/test0/git/refs/tags/latest'
            }
        })
        github.getOctokit.mockReturnValue({
            rest: {
                repos: { createRelease },
                git: { getRef, createRef }
            }
        } as unknown as MockOctokit)

        await run()

        expect(getRef).toHaveBeenCalledWith({
            owner: repo.owner,
            repo: repo.repo,
            ref: 'tags/latest'
        })
        expect(createRef).toHaveBeenCalledWith({
            owner: repo.owner,
            repo: repo.repo,
            ref: 'refs/tags/latest',
            sha
        })
        expect(core.setOutput).toHaveBeenNthCalledWith(1, 'release_id', '3')
        expect(core.setOutput).toHaveBeenNthCalledWith(
            2,
            'latest_url',
            'https://api.github.com/repos/MrMat/test0/git/refs/tags/latest'
        )
    })

    test('propagates a non-404 error from getRef', async () => {
        mockInputs(true)
        const createRelease = jest.fn().mockReturnValue({
            data: { id: 4, target_commitish: 'some-commit' }
        })
        const serverError = new RequestError('Internal Server Error', 500, {
            request: {
                method: 'GET',
                url: 'https://api.github.com',
                headers: {}
            }
        })
        const getRef = jest
            .fn()
            .mockImplementation(() => Promise.reject(serverError))
        github.getOctokit.mockReturnValue({
            rest: {
                repos: { createRelease },
                git: { getRef }
            }
        } as unknown as MockOctokit)

        await run()

        expect(core.setFailed).toHaveBeenCalledWith(
            '[500] Internal Server Error'
        )
    })

    test('fails with a formatted message on RequestError', async () => {
        mockInputs(false)
        const error = new RequestError('Not Found', 404, {
            request: {
                method: 'POST',
                url: 'https://api.github.com',
                headers: {}
            }
        })
        github.getOctokit.mockReturnValue({
            rest: {
                repos: {
                    createRelease: jest
                        .fn()
                        .mockImplementation(() => Promise.reject(error))
                }
            }
        } as unknown as MockOctokit)

        await run()

        expect(core.setFailed).toHaveBeenCalledWith('[404] Not Found')
    })

    test('fails with the error object on a generic error', async () => {
        mockInputs(false)
        const error = new Error('Something went wrong')
        github.getOctokit.mockReturnValue({
            rest: {
                repos: {
                    createRelease: jest
                        .fn()
                        .mockImplementation(() => Promise.reject(error))
                }
            }
        } as unknown as MockOctokit)

        await run()

        expect(core.setFailed).toHaveBeenCalledWith(error)
    })
})
