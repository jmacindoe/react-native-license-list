import { buildLicenseTree } from "./buildLicenseTree"
import { npmLs } from "./npmLs"
import { readLicenseData } from "./readLicenseData"

async function main() {
  const lsTree = await npmLs()
  const licenseData = await readLicenseData({
    start: ".",
    relativeLicensePath: true,
  })
  const output = buildLicenseTree(lsTree, licenseData)
  console.log(output)
}

main()
