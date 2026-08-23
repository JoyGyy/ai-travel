import { describe, expect, it } from 'vitest'

import attractionCredits from '../src/knowledge/attraction-image-credits.json'
import attractions from '../src/knowledge/attractions-product.json'
import {
  type AttractionAsset,
  type ImageAssetFileSystem,
  type ImageCredit,
  verifyImageAssets,
} from './verify-image-assets'

const validWebpHeader = Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBP')

function createFileSystem(overrides: Partial<ImageAssetFileSystem> = {}): ImageAssetFileSystem {
  return {
    statSync: () => ({ size: 1024 }),
    readFileSync: () => validWebpHeader,
    ...overrides,
  }
}

function verifyFixture(
  catalog: AttractionAsset[] = attractions,
  credits: ImageCredit[] = attractionCredits,
  fileSystem: ImageAssetFileSystem = createFileSystem(),
) {
  return () => verifyImageAssets({ attractions: catalog, credits, fileSystem, publicDirectory: '/repo/public' })
}

describe('verifyImageAssets', () => {
  it('validates the real manifest and checked-in image files', () => {
    expect(verifyImageAssets()).toEqual({ attractions: 60, cities: 10, images: 60 })
  })

  it('rejects remote image URLs', () => {
    const catalog = attractions.map((attraction, index) => index === 0
      ? { ...attraction, coverImage: 'https://example.com/attraction.webp' }
      : attraction)

    expect(verifyFixture(catalog)).toThrow('coverImage must be a local WebP attraction path')
  })

  it('rejects duplicate attraction IDs', () => {
    const catalog = attractions.map((attraction, index) => index === 1
      ? { ...attraction, id: attractions[0].id }
      : attraction)

    expect(verifyFixture(catalog)).toThrow(`duplicate attraction id: ${attractions[0].id}`)
  })

  it('rejects unverified image credits', () => {
    const credits = attractionCredits.map((credit, index) => index === 0
      ? { ...credit, verified: false }
      : credit)

    expect(verifyFixture(attractions, credits)).toThrow(`${attractions[0].id}: image credit must be verified`)
  })

  it('rejects missing image files', () => {
    const fileSystem = createFileSystem({
      statSync: () => {
        throw new Error('ENOENT')
      },
    })

    expect(verifyFixture(attractions, attractionCredits, fileSystem)).toThrow('image file is missing or unreadable')
  })

  it('reports a missing credit and its missing file together', () => {
    const credits = attractionCredits.slice(1)
    const fileSystem = createFileSystem({
      statSync: (filePath) => {
        if (filePath.endsWith(`${attractions[0].id}.webp`)) {
          throw new Error('ENOENT')
        }
        return { size: 1024 }
      },
    })

    const verify = verifyFixture(attractions, credits, fileSystem)
    expect(verify).toThrow(`${attractions[0].id}: expected exactly one image credit`)
    expect(verify).toThrow(`${attractions[0].id}: image file is missing or unreadable`)
  })

  it('rejects oversized image files', () => {
    const fileSystem = createFileSystem({ statSync: () => ({ size: 350 * 1024 + 1 }) })

    expect(verifyFixture(attractions, attractionCredits, fileSystem)).toThrow('image exceeds 358400 bytes')
  })

  it('rejects files without a RIFF/WEBP signature', () => {
    const fileSystem = createFileSystem({ readFileSync: () => Buffer.from('not-a-webp') })

    expect(verifyFixture(attractions, attractionCredits, fileSystem)).toThrow('image is not a RIFF/WEBP file')
  })

  it('rejects paths that attempt to traverse outside public', () => {
    const catalog = attractions.map((attraction, index) => index === 0
      ? { ...attraction, coverImage: '/images/attractions/../../secret.webp' }
      : attraction)
    const credits = attractionCredits.map((credit, index) => index === 0
      ? { ...credit, localPath: '/images/attractions/../../secret.webp' }
      : credit)

    expect(verifyFixture(catalog, credits)).toThrow('coverImage resolves outside the public directory')
  })

  it('rejects image paths whose resolved symlink escapes public', () => {
    const fileSystem = {
      ...createFileSystem(),
      realpathSync: (filePath: string) => filePath.endsWith(`${attractions[0].id}.webp`)
        ? '/outside/secret.webp'
        : filePath,
    }

    expect(verifyFixture(attractions, attractionCredits, fileSystem)).toThrow(
      `${attractions[0].id}: image resolves outside the public directory after resolving symlinks`,
    )
  })
})
