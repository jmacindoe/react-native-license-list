import * as t from "io-ts"
import { PathReporter } from "io-ts/lib/PathReporter"
import { load as loadNpm } from "npm"

// This is not officially documented
type Ls = (
  args: any[],
  silent: boolean,
  cb: (error: string | undefined, verboseData: any, liteData: any) => void,
) => void

const NpmLsTreeNode = t.type({
  from: t.string,
  resolved: t.string,
  version: t.string,
})

const NpmLsTreeRoot = t.type({
  name: t.string,
  version: t.string,
  dependencies: t.record(t.string, NpmLsTreeNode),
})

export type NpmLsTreeNode = t.TypeOf<typeof NpmLsTreeNode>
export type NpmLsTreeRoot = t.TypeOf<typeof NpmLsTreeRoot>

export function npmLs(): Promise<NpmLsTreeRoot> {
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

      // @ts-ignore - type definition is missing
      const ls: Ls = npm.commands.ls

      ls([], true, (err, verboseData, liteData) => {
        if (err) {
          reject(err)
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
          resolve(resultOrError)
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
