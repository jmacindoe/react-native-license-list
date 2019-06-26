import { readLicenseData } from "./readLicenseData"

describe("readLicenseData", () => {
  it("returns a list of dependencies from the root directory", async () => {
    const licenses = await readLicenseData({
      start: ".",
      relativeLicensePath: true,
    })
    const testLicense = licenses["license-checker@25.0.1"]
    expect(testLicense.email).toEqual("davglass@gmail.com")
    expect(testLicense.licenseFile).toEqual(
      "node_modules/license-checker/LICENSE",
    )
    expect(testLicense.licenses).toEqual("BSD-3-Clause")
    expect(testLicense.repository).toEqual(
      "https://github.com/davglass/license-checker",
    )
  })

  it("propagates license-checker errors via the promise", async () => {
    await expect(
      readLicenseData({
        start: "doesntExist",
      }),
    ).rejects.toMatchInlineSnapshot(`[Error: No packages found in this path..]`)
  })
})
