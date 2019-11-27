import { parseArgs } from "./args"
import { spawn } from "child_process"
import path from "path"

describe("args", () => {
  it("parses arguments for outputting the license data", () => {
    const actual = parseArgs("./bin --out file.json".split(" "))
    expect(actual.command).toEqual("generate")
    expect(actual.outputPath).toEqual("file.json")
    expect(actual.project).toBeUndefined()
  })

  it("parses arguments for verifying the license data", () => {
    const actual = parseArgs("./bin --verify file.json".split(" "))
    expect(actual.command).toEqual("verify")
    expect(actual.outputPath).toEqual("file.json")
    expect(actual.project).toBeUndefined()
  })

  it("parses a custom project path", () => {
    const actual = parseArgs(
      "./bin --verify file.json --project /foo/bar".split(" "),
    )
    expect(actual.command).toEqual("verify")
    expect(actual.outputPath).toEqual("file.json")
    expect(actual.project).toEqual("/foo/bar")
  })

  it("should exit 1 if both --out and --verify are specified", done => {
    expectOutputCode(1, "--verify --out foo", done)
  })

  it("should exit 1 if there are no cli arguments", done => {
    expectOutputCode(1, "", done)
  })
})

function expectOutputCode(
  expectedCode: number,
  cliArg: string,
  done: jest.DoneCallback,
) {
  const args = [path.join(__dirname, "../lib/index.js")].concat(
    cliArg.split(" "),
  )
  spawn("node", args, {
    cwd: path.join(__dirname, "../"),
    stdio: "ignore",
  }).on("exit", function(code) {
    expect(code).toEqual(expectedCode)
    done()
  })
}
