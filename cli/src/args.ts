import yargs from "yargs"

interface Args {
  command: "generate" | "verify"
  outputPath: string
  project: string | undefined
}

const outArg = "out"
const verifyArg = "verify"

// TODO: add help and examples
const argParser = yargs
  .option(verifyArg, {
    type: "string",
  })
  .option(outArg, {
    type: "string",
    conflicts: ["verify"],
  })
  .option("project", {
    type: "string",
    description: "Project directory to analyze",
  })
  .check(opts => {
    if (!opts.out && !opts.verify) {
      throw new Error(`You must specify either --${outArg} or --${verifyArg}`)
    } else if (opts.out && opts.verify) {
      throw new Error(`You cannot specify both --${outArg} and --${verifyArg}`)
    }
    return true
  })

export function parseArgs(args: string[] = process.argv): Args {
  const parsed = argParser.parse(args)
  return {
    command: parsed.out ? "generate" : "verify",
    outputPath: parsed.out ? parsed.out : parsed.verify!,
    project: parsed.project,
  }
}
