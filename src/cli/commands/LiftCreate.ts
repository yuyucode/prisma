import { Command } from '../types'
import { arg, isError, format } from '../utils'
import prompt from 'prompts'
import { HelpError } from '../Help'
import kleur, { dim, cyan } from 'kleur'
import { Lift } from '../../Lift'
import path from 'path'
import { serializeFileMap } from '../../utils/serializeFileMap'
import { Env } from '../Env'
import { printFiles } from '../../utils/printFiles'
import chalk from 'chalk'
import { printMigrationId } from '../../utils/printMigrationId'
import fs from 'fs'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)

/**
 * $ prisma migrate new
 */
export class LiftCreate implements Command {
  static new(env: Env): LiftCreate {
    return new LiftCreate(env)
  }
  private constructor(private readonly env: Env) {}

  // parse arguments
  async parse(argv: string[]): Promise<string | Error> {
    // parse the arguments according to the spec
    const args = arg(argv, {
      '--help': Boolean,
      '-h': '--help',
      '--name': String,
      '-n': '--name',
      '--preview': Boolean,
      '-p': '--preview',
    })
    if (isError(args)) {
      return this.help(args.message)
    } else if (args['--help']) {
      return this.help()
    }
    const preview = args['--preview'] || false
    const name = preview ? args['--name'] : await this.name(args['--name'])

    const lift = new Lift(this.env.cwd)

    const migration = await lift.create(name, preview)

    if (!migration) {
      return `Everything up-to-date\n` //TODO: find better wording
    }

    const { files, migrationId, newLockFile } = migration

    if (preview)
      return `\nRun ${chalk.greenBright(
        'prisma lift create --name MIGRATION_NAME',
      )} to create the migration\n`

    const migrationsDir = path.join(this.env.cwd, 'migrations', migrationId)
    await serializeFileMap(files, migrationsDir)
    const lockFilePath = path.join(this.env.cwd, 'migrations', 'lift.lock')
    await writeFile(lockFilePath, newLockFile)

    return `\nWe just created your migration ${printMigrationId(
      migrationId,
    )} in\n\n${dim(
      printFiles(`migrations/${migrationId}`, files),
    )}\n\nRun ${chalk.greenBright('prisma lift up')} to apply the migration\n`
  }

  // get the name
  async name(name?: string): Promise<string | undefined> {
    if (name === '') return undefined
    if (name) return name
    let response = await prompt({
      type: 'text',
      name: 'name',
      message: `Name of migration ${dim('(optional)')}`,
      // validate: value => value.length,
    })
    return response.name || undefined
  }

  // help message
  help(error?: string): string | HelpError {
    if (error) {
      return new HelpError(
        `\n${kleur.bold().red(`!`)} ${error}\n${LiftCreate.help}`,
      )
    }
    return LiftCreate.help
  }

  // static help template
  private static help = format(`
    Create a new migration.

    ${kleur.bold('Usage')}

      prisma migrate new [options]

    ${kleur.bold('Options')}

      -n, --name     Name of the migration
      -p, --preview  Preview the changes

    ${kleur.bold('Examples')}

      Create a new migration
      ${kleur.dim(`$`)} prisma migrate new

      Create a new migration by name
      ${kleur.dim(`$`)} prisma migrate new --name "add unique to email"

  `)
}
