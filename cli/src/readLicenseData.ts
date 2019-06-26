import checker, { ModuleInfos, InitOpts } from "license-checker"

export async function readLicenseData(options: InitOpts): Promise<ModuleInfos> {
  return new Promise((resolve, reject) => {
    checker.init(options, (error: Error, results: ModuleInfos) => {
      if (error) {
        reject(error)
      }
      if (!results) {
        reject(new Error("No results from license-checker"))
      }
      resolve(results)
    })
  })
}
