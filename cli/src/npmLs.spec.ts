import { npmLs } from "./npmLs"

describe("npmLs", () => {
  it("returns data for the current package", async () => {
    const data = await npmLs()
    expect(data.name).toEqual("react-native-license-screen-cli")
    expect(data.version).toBeDefined()
    expect(data.dependencies).toBeDefined()
  })
})
