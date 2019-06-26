import { npmLs } from "./npmLs"

describe("npmLs", () => {
  test("data is in expected io-ts format", async () => {
    await expect(npmLs()).resolves.toBeDefined()
  })
})
