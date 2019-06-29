import { ModuleInfos } from "license-checker"
import { buildLicenseTree } from "./buildLicenseTree"
import { DependencyTreeNode } from "./npmLs"

const zeroDepLs: DependencyTreeNode = {
  name: "the-project",
  version: "1.0.1",
  dependencies: [],
}

const testLicenseData: ModuleInfos = {
  "the-project@1.0.1": {},
  "the-dep@2.1.0": {},
  "transitive-dep@0.0.1": {},
}

describe("buildLicenseTree", () => {
  it("errors if a package is in npm ls but not license-checker", () => {
    const ls: DependencyTreeNode = {
      name: "unknown-project",
      version: "1.0.1",
      dependencies: [],
    }

    expect(() =>
      buildLicenseTree(ls, testLicenseData),
    ).toThrowErrorMatchingInlineSnapshot(
      `"No data from license-checker for unknown-project@1.0.1 but it appears in output of npm ls"`,
    )
  })

  it("returns the project root for a project without dependencies", () => {
    expect(buildLicenseTree(zeroDepLs, testLicenseData)).toEqual({
      name: "the-project",
      version: "1.0.1",
      dependencies: [],
    })
  })

  it("includes data from license-checker", () => {
    const licenseData: ModuleInfos = {
      "the-project@1.0.1": {
        licenses: "MIT",
        repository: "https://github.com/jmacindoe/the-project",
        publisher: "Myself",
        email: "me@example.com",
        url: "me.example.com",
        licenseFile: "LICENSE.txt",
      },
    }
    expect(buildLicenseTree(zeroDepLs, licenseData)).toEqual({
      name: "the-project",
      version: "1.0.1",
      licenses: "MIT",
      repositoryURL: "https://github.com/jmacindoe/the-project",
      publisherName: "Myself",
      publisherEmail: "me@example.com",
      publisherURL: "me.example.com",
      licenseFile: "LICENSE.txt",
      licenseURL:
        "https://github.com/jmacindoe/the-project/blob/master/LICENSE.txt",
      dependencies: [],
    })
  })

  it("includes root level dependencies", () => {
    const ls: DependencyTreeNode = {
      name: "the-project",
      version: "1.0.1",
      dependencies: [
        {
          name: "the-dep",
          version: "2.1.0",
          dependencies: [],
        },
      ],
    }

    expect(buildLicenseTree(ls, testLicenseData)).toEqual({
      name: "the-project",
      version: "1.0.1",
      dependencies: [
        {
          name: "the-dep",
          version: "2.1.0",
          dependencies: [],
        },
      ],
    })
  })

  it("includes transitive dependencies in the output", () => {
    const ls: DependencyTreeNode = {
      name: "the-project",
      version: "1.0.1",
      dependencies: [
        {
          name: "the-dep",
          version: "2.1.0",
          dependencies: [
            {
              name: "transitive-dep",
              version: "0.0.1",
              dependencies: [],
            },
          ],
        },
      ],
    }

    expect(buildLicenseTree(ls, testLicenseData)).toEqual({
      name: "the-project",
      version: "1.0.1",
      dependencies: [
        {
          name: "the-dep",
          version: "2.1.0",
          dependencies: [
            {
              name: "transitive-dep",
              version: "0.0.1",
              dependencies: [],
            },
          ],
        },
      ],
    })
  })

  it("includes the license URL for github repos", () => {
    expect(
      actualLicenseURL("https://github.com/jmacindoe/the-project"),
    ).toEqual("https://github.com/jmacindoe/the-project/blob/master/LICENSE")
  })

  it("includes the license URL for bitbucket repos", () => {
    expect(
      actualLicenseURL("https://bitbucket.org/macindoe/the-project"),
    ).toEqual("https://bitbucket.org/macindoe/the-project/src/master/LICENSE")
  })

  it("sets the license URL to the repo url for unknown git hosting", () => {
    expect(actualLicenseURL("https://unknown.example.com/the-project")).toEqual(
      "https://unknown.example.com/the-project",
    )
  })

  it("sets the license URL to the repo url for seemingly invalid URLs", () => {
    expect(actualLicenseURL("invalid-url")).toEqual("invalid-url")
  })

  it("includes the license URL for transitive dependencies", () => {
    const ls: DependencyTreeNode = {
      name: "the-project",
      version: "1.0.1",
      dependencies: [
        {
          name: "the-dep",
          version: "2.1.0",
          dependencies: [
            {
              name: "transitive-dep",
              version: "0.0.1",
              dependencies: [],
            },
          ],
        },
      ],
    }

    const licenseData: ModuleInfos = {
      "the-project@1.0.1": {},
      "the-dep@2.1.0": {},
      "transitive-dep@0.0.1": {
        licenses: "MIT",
        repository: "https://github.com/jmacindoe/transitive-dep",
        licenseFile: "node_modules/transitive-dep/LICENSE",
      },
    }

    const root = buildLicenseTree(ls, licenseData)
    expect(root.dependencies[0].dependencies[0].licenseURL).toEqual(
      "https://github.com/jmacindoe/transitive-dep/blob/master/LICENSE",
    )
  })
})

function actualLicenseURL(repository: string): string | undefined {
  const licenseData: ModuleInfos = {
    "the-project@1.0.1": {
      licenses: "MIT",
      repository,
      licenseFile: "LICENSE",
    },
  }

  const root = buildLicenseTree(zeroDepLs, licenseData)
  return root.licenseURL
}
