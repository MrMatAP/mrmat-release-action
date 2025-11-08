import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)

const { run } = await import('../src/main.js')

describe('GitHub Actions Interface', () => {
    test.each([
        {
            repo: { owner: 'MrMat', repo: 'test0' },
            release_name: 'v1.0.0',
            release_description: 'Release description',
            release_version: 'v1.0.0',
            update_latest: false,
            circumstances: {
                has_latest_tag: true
            },
            expected: {
                desc: 'Can create a release without updating the latest tag',
                id: 1
            }
        },
    ])(
        '$expected.desc',
        async ({
            repo,
            release_name,
            release_description,
            release_version,
            update_latest,
            expected
        }) => {
            core.getInput.mockImplementation((input: string) => {
                switch (input) {
                    case 'github_token':
                        return 'test-token'
                    case 'release_name':
                        return release_name
                    case 'release_description':
                        return release_description
                    case 'release_version':
                        return release_version
                    case 'update_latest':
                        return update_latest.toString()
                    default:
                        throw new Error(`Unexpected input: ${input}`)
                }
            })
            const createRelease = jest.fn().mockReturnValue({
                data: {
                    id: expected.id,
                    target_commitish: 'some-commit'
                }
            })
            // const getRef = jest.fn().mockImplementation(() => {
            //     if (! circumstances.has_latest_tag) {
            //         throw new RequestError()
            //     }
            // })

            // @ts-expect-error - Mocking the getOctokit function
            github.getOctokit.mockImplementation(() => {
                return {
                    rest: {
                        repos: {
                            createRelease
                        }
                    }
                }
            })
            github.context.repo = repo

            await run()

            expect(createRelease).toHaveBeenCalledWith({
                owner: repo.owner,
                repo: repo.repo,
                tag_name: release_version,
                name: release_name,
                body: release_description,
                draft: false,
                prerelease: false,
                generate_release_notes: true
            })
            expect(core.setOutput).toHaveBeenNthCalledWith(
                1,
                'id',
                `${expected.id}`
            )
            jest.resetAllMocks()
        }
    )
})
