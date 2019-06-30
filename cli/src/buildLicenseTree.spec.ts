import { ModuleInfos } from "license-checker"
import { buildLicenseTree } from "./buildLicenseTree"
import { DependencyTreeNode } from "./npmLs"

jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => "License text"),
}))

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
        // @ts-ignore: TODO: add noticeFile to the TS definitions
        noticeFile: "NOTICE",
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
      licenseText: "License text",
      noticeFile: "NOTICE",
      noticeText: "License text",
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
})
