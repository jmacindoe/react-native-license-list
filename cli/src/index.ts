import { buildLicenseTree } from "./buildLicenseTree"
import { npmLs } from "./npmLs"
import { readLicenseData } from "./readLicenseData"
import { parseArgs } from "./args"
import fs from "fs"

async function main() {
  const args = parseArgs()

  // npm ls will run in the current working directory, we can't tell it where to run
  const cwd = process.cwd()
  const start = args.project || "."
  process.chdir(start)

  const lsTree = await npmLs()
  const licenseData = await readLicenseData({
    start: ".",
    relativeLicensePath: true,
  })
  const output = buildLicenseTree(lsTree, licenseData)

  process.chdir(cwd)
  fs.writeFileSync(args.outputPath, JSON.stringify(output, null, 2))
}

main()
