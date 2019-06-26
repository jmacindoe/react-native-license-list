import { load as loadNpm } from "npm"

// This is not officially documented
type Ls = (
  args: any[],
  silent: boolean,
  cb: (error: string | undefined, verboseData: any, liteData: any) => void,
) => void

export function npmLs(): Promise<any> {
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

        resolve(liteData)
      })
    })
  })
}
