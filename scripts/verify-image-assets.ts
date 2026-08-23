import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import attractionCredits from '../src/knowledge/attraction-image-credits.json'
import attractions from '../src/knowledge/attractions-product.json'

const MAX_IMAGE_BYTES = 350 * 1024
const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_PUBLIC_DIRECTORY = path.join(REPOSITORY_ROOT, 'public')

export interface AttractionAsset {
  city: string
  coverImage: string
  id: string
}

export interface ImageCredit {
  attractionId: string
  author: string
  license: string
  licenseUrl?: string
  localPath: string
  sourcePage: string
  verified: boolean
}

export interface ImageAssetFileSystem {
  readFileSync(filePath: string): Uint8Array
  realpathSync?: (filePath: string) => string
  statSync(filePath: string): { size: number }
}

export interface VerifyImageAssetsOptions {
  attractions?: AttractionAsset[]
  credits?: ImageCredit[]
  fileSystem?: ImageAssetFileSystem
  publicDirectory?: string
}

export interface ImageAssetSummary {
  attractions: number
  cities: number
  images: number
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  }
  catch {
    return false
  }
}

function isLocalAttractionWebpPath(coverImage: string): boolean {
  return coverImage.startsWith('/images/attractions/') && coverImage.endsWith('.webp')
}

function resolvePublicAssetPath(coverImage: string, publicDirectory: string): string | null {
  const relativePath = coverImage.slice(1)
  const hasTraversalSegment = relativePath.split('/').some(segment => segment === '.' || segment === '..')
  const resolvedPath = path.resolve(publicDirectory, relativePath)

  if (hasTraversalSegment || coverImage.includes('\\') || !isPathInsideDirectory(resolvedPath, publicDirectory)) {
    return null
  }

  return resolvedPath
}

function isPathInsideDirectory(filePath: string, directory: string): boolean {
  return filePath.startsWith(`${directory}${path.sep}`)
}

function hasWebpSignature(file: Uint8Array): boolean {
  return file.length >= 12
    && Buffer.from(file.subarray(0, 4)).toString('ascii') === 'RIFF'
    && Buffer.from(file.subarray(8, 12)).toString('ascii') === 'WEBP'
}

/** Validates the checked-in attraction images and their provenance records. */
export function verifyImageAssets(options: VerifyImageAssetsOptions = {}): ImageAssetSummary {
  const catalog = options.attractions ?? attractions
  const credits = options.credits ?? attractionCredits
  const fileSystem = options.fileSystem ?? fs
  const publicDirectory = path.resolve(options.publicDirectory ?? DEFAULT_PUBLIC_DIRECTORY)
  const errors: string[] = []
  const ids = new Set<string>()
  const cities = new Map<string, number>()
  const creditsByAttractionId = new Map<string, ImageCredit[]>()

  if (catalog.length !== 60) {
    errors.push(`expected 60 attractions, found ${catalog.length}`)
  }

  for (const attraction of catalog) {
    if (ids.has(attraction.id)) {
      errors.push(`duplicate attraction id: ${attraction.id}`)
    }
    ids.add(attraction.id)
    cities.set(attraction.city, (cities.get(attraction.city) ?? 0) + 1)

    if (!isLocalAttractionWebpPath(attraction.coverImage)) {
      errors.push(`${attraction.id}: coverImage must be a local WebP attraction path`)
    }
  }

  if (ids.size !== 60) {
    errors.push(`expected 60 unique attraction IDs, found ${ids.size}`)
  }
  if (cities.size !== 10) {
    errors.push(`expected 10 cities, found ${cities.size}`)
  }
  for (const [city, count] of cities) {
    if (count !== 6) {
      errors.push(`${city}: expected 6 attractions, found ${count}`)
    }
  }

  for (const credit of credits) {
    const matchingCredits = creditsByAttractionId.get(credit.attractionId) ?? []
    matchingCredits.push(credit)
    creditsByAttractionId.set(credit.attractionId, matchingCredits)

    if (!ids.has(credit.attractionId)) {
      errors.push(`${credit.attractionId}: image credit references an unknown attraction`)
    }
  }

  for (const attraction of catalog) {
    const matchingCredits = creditsByAttractionId.get(attraction.id) ?? []

    if (matchingCredits.length !== 1) {
      errors.push(`${attraction.id}: expected exactly one image credit, found ${matchingCredits.length}`)
    }
    else {
      const [credit] = matchingCredits
      if (!credit.verified) {
        errors.push(`${attraction.id}: image credit must be verified`)
      }
      if (credit.localPath !== attraction.coverImage) {
        errors.push(`${attraction.id}: image credit localPath must match coverImage`)
      }
      if (!credit.author.trim()) {
        errors.push(`${attraction.id}: image credit author is required`)
      }
      if (!isHttpUrl(credit.sourcePage)) {
        errors.push(`${attraction.id}: image credit sourcePage must be a valid HTTP(S) URL`)
      }
      if (!credit.license.trim()) {
        errors.push(`${attraction.id}: image credit license is required`)
      }
      if (credit.licenseUrl && !isHttpUrl(credit.licenseUrl)) {
        errors.push(`${attraction.id}: image credit licenseUrl must be a valid HTTP(S) URL`)
      }
    }

    if (!isLocalAttractionWebpPath(attraction.coverImage)) {
      continue
    }

    const assetPath = resolvePublicAssetPath(attraction.coverImage, publicDirectory)
    if (!assetPath) {
      errors.push(`${attraction.id}: coverImage resolves outside the public directory`)
      continue
    }

    try {
      const resolvedPublicDirectory = fileSystem.realpathSync?.(publicDirectory) ?? publicDirectory
      const resolvedAssetPath = fileSystem.realpathSync?.(assetPath) ?? assetPath
      if (!isPathInsideDirectory(resolvedAssetPath, resolvedPublicDirectory)) {
        errors.push(`${attraction.id}: image resolves outside the public directory after resolving symlinks`)
        continue
      }

      const { size } = fileSystem.statSync(assetPath)
      if (size > MAX_IMAGE_BYTES) {
        errors.push(`${attraction.id}: image exceeds ${MAX_IMAGE_BYTES} bytes`)
      }

      const contents = fileSystem.readFileSync(assetPath)
      if (!hasWebpSignature(contents)) {
        errors.push(`${attraction.id}: image is not a RIFF/WEBP file`)
      }
    }
    catch {
      errors.push(`${attraction.id}: image file is missing or unreadable`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Image asset verification failed:\n${errors.map(error => `- ${error}`).join('\n')}`)
  }

  return {
    attractions: catalog.length,
    cities: cities.size,
    images: catalog.length,
  }
}

const executedAsScript = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (executedAsScript) {
  try {
    const summary = verifyImageAssets()
    console.log(`${summary.attractions} attractions, ${summary.cities} cities, ${summary.images} images`)
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
