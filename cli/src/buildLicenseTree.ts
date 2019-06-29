import { ModuleInfos } from "license-checker"
import { DependencyTreeNode } from "./npmLs"
import { URL } from "url"

interface LicenseTreeNode {
  name: string
  version?: string
  repositoryURL?: string
  publisherName?: string
  publisherEmail?: string
  publisherURL?: string
  licenseFile?: string
  licenses?: string | string[]
  licenseURL?: string
  dependencies: LicenseTreeNode[]
}

export function buildLicenseTree(
  lsTree: DependencyTreeNode,
  licenseData: ModuleInfos,
): LicenseTreeNode {
  const key = `${lsTree.name}@${lsTree.version}`
  const info = licenseData[key]
  if (!info) {
    throw Error(
      `No data from license-checker for ${key} but it appears in output of npm ls`,
    )
  }
  return {
    name: lsTree.name,
    version: lsTree.version,
    ...(info.repository
      ? {
          repositoryURL: info.repository,
        }
      : {}),
    ...(info.publisher
      ? {
          publisherName: info.publisher,
        }
      : {}),
    ...(info.email
      ? {
          publisherEmail: info.email,
        }
      : {}),
    ...(info.url
      ? {
          publisherURL: info.url,
        }
      : {}),
    ...(info.licenseFile
      ? {
          licenseFile: info.licenseFile,
        }
      : {}),
    // TODO: deal with undefined, UNKNOWN, etc
    licenses: info.licenses,
    ...(info.repository && info.licenseFile
      ? {
          licenseURL: licenseURL(
            lsTree.name,
            info.repository,
            info.licenseFile,
          ),
        }
      : {}),
    dependencies: lsTree.dependencies.map(dep =>
      buildLicenseTree(dep, licenseData),
    ),
  }
}

function licenseURL(
  name: string,
  repository: string,
  licenseFile: string,
): string | undefined {
  const licensePath = licenseFilePath(name, licenseFile)
  const srcPath = repoSrcPath(repository)
  return srcPath ? repository + srcPath + licensePath : repository
}

function licenseFilePath(
  /// e.g. "yargs-parser"
  name: string,
  /// e.g. "node_modules/metro/node_modules/yargs-parser/LICENSE.txt"
  licenseFile: string,
): string {
  const components = licenseFile.split(`node_modules/${name}/`)
  return components[components.length - 1]
}

const srcPathByHost: Record<string, string> = {
  "github.com": "/blob/master/",
  "bitbucket.org": "/src/master/",
}

function repoSrcPath(repo: string): string | undefined {
  const repoURL = repositoryURL(repo)
  if (!repoURL) {
    return undefined
  }
  return srcPathByHost[repoURL.hostname]
}

function repositoryURL(repository: string): URL | undefined {
  try {
    return new URL(repository)
  } catch (e) {
    console.warn("Unable to parse repo URL: " + repository)
    return undefined
  }
}
