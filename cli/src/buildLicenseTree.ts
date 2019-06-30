import fs from "fs"
import { ModuleInfos } from "license-checker"
import { DependencyTreeNode } from "./npmLs"

interface LicenseTreeNode {
  name: string
  version?: string
  repositoryURL?: string
  publisherName?: string
  publisherEmail?: string
  publisherURL?: string
  licenses?: string | string[]
  licenseFile?: string
  licenseText?: string
  noticeFile?: string
  noticeText?: string
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
    // TODO: deal with undefined, UNKNOWN, etc
    licenses: info.licenses,
    ...(info.licenseFile
      ? {
          licenseFile: info.licenseFile,
        }
      : {}),
    ...(info.licenseText || info.licenseFile
      ? {
          licenseText: info.licenseText || readFile(info.licenseFile!),
        }
      : {}),
    // @ts-ignore: TODO: add noticeFile to the TS definitions
    ...(info.noticeFile
      ? {
          // @ts-ignore: TODO: add noticeFile to the TS definitions
          noticeFile: info.noticeFile,
          // @ts-ignore: TODO: add noticeFile to the TS definitions
          noticeText: readFile(info.noticeFile),
        }
      : {}),
    dependencies: lsTree.dependencies.map(dep =>
      buildLicenseTree(dep, licenseData),
    ),
  }
}

function readFile(licenseFile: string): string {
  return fs.readFileSync(licenseFile).toString()
}
