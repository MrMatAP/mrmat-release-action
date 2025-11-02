import type * as github from '@actions/github'
import { jest } from '@jest/globals'

export const context = {
    repo: {
        owner: 'MrMat',
        repo: 'test'
    }
}

export const getOctokit = jest.fn<typeof github.getOctokit>()
