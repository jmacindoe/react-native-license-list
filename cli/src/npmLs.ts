import * as t from "io-ts"
import { PathReporter } from "io-ts/lib/PathReporter"
import { load as loadNpm } from "npm"

/**
 * A module to return data similar to `npm ls --json` but with some clean up so
 * the data is easier to work with.
 */

/// Output data format

export interface DependencyTreeNode {
  name: string
  version: string
  dependencies: DependencyTreeNode[]
}

/// Input data format from `npm ls`

const UnmetPeerDependency = t.type({
  peerMissing: t.literal(true),
})

type UnmetPeerDependency = t.TypeOf<typeof UnmetPeerDependency>

interface NpmLsTreeNode {
  from: string
  version: string
  dependencies?: Record<string, NpmLsTreeNode | UnmetPeerDependency>
}

const NpmLsTreeNode: t.Type<NpmLsTreeNode> = t.recursion(
  "NpmLsTreeNode",
  () => {
    const required = t.type({
      from: t.string,
      version: t.string,
    })
    const partial = t.partial({
      dependencies: t.union([
        t.undefined,
        t.record(t.string, t.union([NpmLsTreeNode, UnmetPeerDependency])),
      ]),
    })
    return t.intersection([required, partial])
  },
)

const NpmLsTreeRoot = t.type({
  name: t.string,
  version: t.string,
  dependencies: t.union([
    t.undefined,
    t.record(t.string, t.union([NpmLsTreeNode, UnmetPeerDependency])),
  ]),
})

type NpmLsTreeRoot = t.TypeOf<typeof NpmLsTreeRoot>

type NpmLs = (
  args: any[],
  silent: boolean,
  cb: (error: string | undefined, verboseData: any, liteData: any) => void,
) => void

export function npmLs(): Promise<DependencyTreeNode> {
  return loadNpmLs()
    .then(performLs)
    .then(validateData(NpmLsTreeRoot))
    .then(cleanRootData)
}

function loadNpmLs(): Promise<NpmLs> {
  return new Promise((resolve, reject) => {
    loadNpm((error, npm) => {
      if (error) {
        reject(error)
        return
      }

      if (!npm) {
        reject(new Error("npm and error are both not defined"))
        return
      }

      // @ts-ignore - type definition is missing/not officially documented
      const ls: NpmLs = npm.commands.ls
      resolve(ls)
    })
  })
}

function performLs(ls: NpmLs): Promise<any> {
  return new Promise((resolve, reject) => {
    ls([], true, (err, verboseData, liteData) => {
      if (err) {
        reject(new Error(err))
        return
      }

      if (!liteData) {
        reject(new Error("No data from npm ls"))
        return
      }

      resolve(liteData)
    })
  })
}

function validateData<A>(type: t.InterfaceType<any, A, any>): (data: any) => A {
  return (data: any) => {
    const decoded = type.decode(data)
    if (decoded.isLeft()) {
      const errors = PathReporter.report(decoded)
      throw new Error(
        `Data does not match expected format. Data: ${JSON.stringify(
          data,
        )}. Errors: ${errors}.`,
      )
    } else {
      return decoded.value
    }
  }
}

function cleanRootData(lsData: NpmLsTreeRoot): DependencyTreeNode {
  return cleanNpmLsData(lsData.name, lsData.version, lsData.dependencies)
}

function cleanNpmLsData(
  name: string,
  version: string,
  dependencies?: Record<string, NpmLsTreeNode | UnmetPeerDependency>,
): DependencyTreeNode {
  return {
    name,
    version,
    dependencies: cleanDependencies(dependencies),
  }
}

function cleanDependencies(
  dependencies: Record<string, NpmLsTreeNode | UnmetPeerDependency> = {},
): DependencyTreeNode[] {
  return Object.entries(dependencies)
    .map(([name, npmLsEntry]) => cleanDependency(name, npmLsEntry))
    .filter(isDefined)
}

function cleanDependency(
  name: string,
  npmLsEntry: NpmLsTreeNode | UnmetPeerDependency,
): DependencyTreeNode | null {
  if (isUnmetPeerDependency(npmLsEntry)) {
    return null
  }
  return cleanNpmLsData(name, npmLsEntry.version, npmLsEntry.dependencies)
}

function isUnmetPeerDependency(
  dependency: NpmLsTreeNode | UnmetPeerDependency,
): dependency is UnmetPeerDependency {
  // @ts-ignore
  return dependency.peerMissing
}

function isDefined<T>(value: T | null | undefined): value is T {
  if (value === null || value === undefined) {
    return false
  } else {
    return true
  }
}
