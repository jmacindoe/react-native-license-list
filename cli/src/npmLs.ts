import * as t from "io-ts"
import { PathReporter } from "io-ts/lib/PathReporter"
import { load as loadNpm } from "npm"
import { RecordExt } from "./ext/RecordExt"

/**
 * A module to return data similar to `npm ls --json` but with some clean up so
 * the data is easier to work with.
 */


/// Output data format

export interface DependencyTreeRoot {
  name: string
  version: string
  dependencies: Record<string, DependencyTreeNode>
}

export interface DependencyTreeNode {
  from: string
  version: string
  dependencies: Record<string, DependencyTreeNode>
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

export function npmLs(): Promise<DependencyTreeRoot> {
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

      ls([], true, (err, verboseData, liteData) => {
        if (err) {
          reject(new Error(err))
          return
        }

        if (!liteData) {
          reject(new Error("No data from npm ls"))
          return
        }

        const resultOrError = validateData(NpmLsTreeRoot, liteData)

        if (resultOrError instanceof Error) {
          reject(resultOrError)
        } else {
          const result = stripUnmetPeerDependencies(resultOrError)
          resolve(result)
        }
      })
    })
  })
}

function validateData<A>(
  type: t.InterfaceType<any, A, any>,
  data: any,
): Error | A {
  const decoded = type.decode(data)
  if (decoded.isLeft()) {
    const errors = PathReporter.report(decoded)
    return new Error(
      `Data does not match expected format. Data: ${JSON.stringify(
        data,
      )}. Errors: ${errors}.`,
    )
  } else {
    return decoded.value
  }
}

function stripUnmetPeerDependencies(lsData: NpmLsTreeRoot): DependencyTreeRoot {
  return {
    name: lsData.name,
    version: lsData.version,
    dependencies: lsData.dependencies
      ? RecordExt.compactMapValues(lsData.dependencies, filterPeerDependencies)
      : {},
  }
}

function stripPeerDependenciesFromNode(
  lsData: NpmLsTreeNode,
): DependencyTreeNode {
  return {
    from: lsData.from,
    version: lsData.version,
    dependencies: lsData.dependencies
      ? RecordExt.compactMapValues(lsData.dependencies, filterPeerDependencies)
      : {},
  }
}

function filterPeerDependencies(
  dependency: NpmLsTreeNode | UnmetPeerDependency,
): DependencyTreeNode | null {
  if (isUnmetPeerDependency(dependency)) {
    return null
  } else {
    return stripPeerDependenciesFromNode(dependency)
  }
}

function isUnmetPeerDependency(
  dependency: NpmLsTreeNode | UnmetPeerDependency,
): dependency is UnmetPeerDependency {
  // @ts-ignore
  return dependency.peerMissing
}
