import { npmLs } from "./npmLs"

jest.mock("npm", () => ({
  load: jest.fn(),
}))

function mockNpmLoad(npmModule: any, liteData: any, error?: string): any {
  const ls = (
    args: any,
    silent: any,
    cb: (error: string | undefined, verboseData: any, liteData: any) => void,
  ) => {
    cb(error, {}, liteData)
  }
  const npm = {
    commands: {
      ls,
    },
  }

  npmModule.load.mockImplementation((callback: any) => callback(undefined, npm))
}

describe("npmLs", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it("forwards errors from loading npm", async () => {
    const npm = require("npm")
    npm.load.mockImplementation((callback: any) =>
      callback(new Error("Loading failed!"), undefined),
    )
    await expect(npmLs()).rejects.toMatchInlineSnapshot(
      `[Error: Loading failed!]`,
    )
  })

  it("errors if npm load doesn't return data or error", async () => {
    const npm = require("npm")
    npm.load.mockImplementation((callback: any) =>
      callback(undefined, undefined),
    )
    await expect(npmLs()).rejects.toMatchInlineSnapshot(
      `[Error: npm and error are both not defined]`,
    )
  })

  it("forwards errors from npm ls", async () => {
    mockNpmLoad(require("npm"), undefined, "npm ls failed!")
    await expect(npmLs()).rejects.toMatchInlineSnapshot(
      `[Error: npm ls failed!]`,
    )
  })

  it("errors if npm ls doesn't return data or error", async () => {
    mockNpmLoad(require("npm"), undefined, undefined)
    await expect(npmLs()).rejects.toMatchInlineSnapshot(
      `[Error: No data from npm ls]`,
    )
  })

  it("errors if data is not in correct format", async () => {
    const data = {
      noName: "the name is missing",
      version: "1.0.1",
      dependencies: {},
    }
    mockNpmLoad(require("npm"), data)
    await expect(npmLs()).rejects.toMatchInlineSnapshot(
      `[Error: Data does not match expected format. Data: {"noName":"the name is missing","version":"1.0.1","dependencies":{}}. Errors: Invalid value undefined supplied to : { name: string, version: string, dependencies: (undefined | { [K in string]: (NpmLsTreeNode | { peerMissing: true }) }) }/name: string.]`,
    )
  })

  it("parses direct dependencies", async () => {
    const data = (allFields: boolean) => ({
      name: "the project",
      version: "1.0.1",
      dependencies: {
        "the-dep": {
          from: "the-dep@^2.0.0",
          version: "2.1.0",
          ...(allFields ? { dependencies: {} } : {}),
        },
      },
    })
    mockNpmLoad(require("npm"), data(false))
    await expect(npmLs()).resolves.toEqual(data(true))
  })

  it("parses transitive dependencies", async () => {
    const data = (allFields: boolean) => ({
      name: "the project",
      version: "1.0.1",
      dependencies: {
        "the-dep": {
          from: "the-dep@^2.0.0",
          version: "2.1.0",
          dependencies: {
            "transitive-dep": {
              from: "transitive-dep@0.0.1",
              version: "0.0.1",
              ...(allFields ? { dependencies: {} } : {}),
            },
          },
        },
      },
    })
    mockNpmLoad(require("npm"), data(false))
    await expect(npmLs()).resolves.toEqual(data(true))
  })

  it("strips unmet peer dependencies", async () => {
    const data = {
      name: "the project",
      version: "1.0.1",
      dependencies: {
        "unmet-dep1": {
          peerMissing: true,
        },
        "the-dep": {
          from: "the-dep@^2.0.0",
          version: "2.1.0",
          dependencies: {
            "unmet-dep2": {
              peerMissing: true,
            },
          },
        },
      },
    }
    mockNpmLoad(require("npm"), data)
    await expect(npmLs()).resolves.toEqual({
      name: "the project",
      version: "1.0.1",
      dependencies: {
        "the-dep": {
          from: "the-dep@^2.0.0",
          version: "2.1.0",
          dependencies: {},
        },
      },
    })
  })
})
