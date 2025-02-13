import fs from 'fs-jetpack'
import { DbSeed } from '../commands/DbSeed'
import { consoleContext, Context } from './__helpers__/context'

const ctx = Context.new().add(consoleContext()).assemble()

describe('seed', () => {
  it('seed.js', async () => {
    ctx.fixture('seed-sqlite-js')

    const result = DbSeed.new().parse([])
    await expect(result).resolves.toMatchInlineSnapshot(`

                                                                                                                                                                                                🌱  The seed command has been executed.
                                                                                                                                                                `)

    expect(
      ctx.mocked['console.info'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(`Running seed command \`node prisma/seed.js\` ...`)
    expect(
      ctx.mocked['console.log'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
    expect(
      ctx.mocked['console.error'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
  })

  it('one broken seed.js file', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation()

    ctx.fixture('seed-sqlite-js')
    fs.write('prisma/seed.js', 'BROKEN_CODE_SHOULD_ERROR;')

    const result = DbSeed.new().parse([])
    await expect(result).resolves.toMatchInlineSnapshot(``)
    expect(
      ctx.mocked['console.info'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(`Running seed command \`node prisma/seed.js\` ...`)
    expect(ctx.mocked['console.error'].mock.calls.join()).toContain(
      'An error occured while running the seed command:',
    )
    expect(mockExit).toBeCalledWith(1)
  })

  it('seed.ts', async () => {
    ctx.fixture('seed-sqlite-ts')

    const result = DbSeed.new().parse([])
    await expect(result).resolves.toMatchInlineSnapshot(`

                                                                                                                                                                                                                        🌱  The seed command has been executed.
                                                                                                                                                                                    `)
    expect(
      ctx.mocked['console.info'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(
      `Running seed command \`ts-node prisma/seed.ts\` ...`,
    )
    expect(
      ctx.mocked['console.error'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
  })

  it('seed.sh', async () => {
    ctx.fixture('seed-sqlite-sh')

    const result = DbSeed.new().parse([])
    await expect(result).resolves.toMatchInlineSnapshot(`

                                                                                                                                                                                                                        🌱  The seed command has been executed.
                                                                                                                                                                                    `)
    expect(
      ctx.mocked['console.info'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(`Running seed command \`./prisma/seed.sh\` ...`)
    expect(
      ctx.mocked['console.error'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
  })
})

describe('seed - legacy', () => {
  it('no seed file', async () => {
    ctx.fixture('seed-sqlite-legacy')
    ctx.fs.remove('prisma/seed.js')
    ctx.fs.remove('prisma/seed.ts')
    ctx.fs.remove('prisma/seed.sh')

    try {
      await DbSeed.new().parse([])
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`
        To configure seeding in your project you need to add a "prisma.seed" property in your package.json with the command to execute it:

        1. Open the package.json of your project
        2. Add one of the following examples to your package.json:

        TypeScript:
        \`\`\`
        "prisma": {
          "seed": "ts-node ./prisma/seed.ts"
        }
        \`\`\`
        And install the required dependencies by running:
        npm i -D ts-node typescript @types/node

        JavaScript:
        \`\`\`
        "prisma": {
          "seed": "node ./prisma/seed.js"
        }
        \`\`\`

        Bash:
        \`\`\`
        "prisma": {
          "seed": "./prisma/seed.sh"
        }
        \`\`\`
        And run \`chmod +x prisma/seed.sh\` to make it executable.
        More information in our documentation:
        https://pris.ly/d/seeding
      `)
    }

    expect(
      ctx.mocked['console.info'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
    expect(
      ctx.mocked['console.error'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
  })

  it('more than one seed file', async () => {
    ctx.fixture('seed-sqlite-legacy')

    const result = DbSeed.new().parse([])
    await expect(result).rejects.toThrowErrorMatchingInlineSnapshot(`
To configure seeding in your project you need to add a "prisma.seed" property in your package.json with the command to execute it:

1. Open the package.json of your project
2. Add the following example to it:
\`\`\`
"prisma": {
  "seed": "node prisma/seed.js"
}
\`\`\`

More information in our documentation:
https://pris.ly/d/seeding
`)

    expect(
      ctx.mocked['console.info'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
    expect(
      ctx.mocked['console.error'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
  })

  it('deprecation of --preview-feature flag', async () => {
    ctx.fixture('seed-sqlite-js')

    const result = DbSeed.new().parse(['--preview-feature'])
    await expect(result).resolves.toMatchInlineSnapshot(`

                        🌱  The seed command has been executed.
                    `)
    expect(
      ctx.mocked['console.info'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(`Running seed command \`node prisma/seed.js\` ...`)
    expect(ctx.mocked['console.warn'].mock.calls.join('\n'))
      .toMatchInlineSnapshot(`
      prisma:warn Prisma "db seed" was in Preview and is now Generally Available.
      You can now remove the --preview-feature flag.
    `)
    expect(
      ctx.mocked['console.error'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
  })

  // legacy flag should warn
  it('using --schema should warn', async () => {
    ctx.fixture('seed-sqlite-js')

    const result = DbSeed.new().parse(['--schema=./some-folder/schema.prisma'])
    await expect(result).resolves.toMatchInlineSnapshot(`

                                                                                                                                                                                                                        🌱  The seed command has been executed.
                                                                                                                                                                                    `)
    expect(
      ctx.mocked['console.info'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(`Running seed command \`node prisma/seed.js\` ...`)
    expect(
      ctx.mocked['console.warn'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(
      `prisma:warn The "--schema" parameter is not used anymore by "prisma db seed" since version 3.0 and can now be removed.`,
    )
    expect(
      ctx.mocked['console.error'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
  })

  it('custom --schema from package.json should enrich help setup', async () => {
    ctx.fixture('seed-sqlite-legacy-schema-from-package-json')

    const result = DbSeed.new().parse([])
    await expect(result).rejects.toMatchInlineSnapshot(`
            To configure seeding in your project you need to add a "prisma.seed" property in your package.json with the command to execute it:

            1. Open the package.json of your project
            2. Add the following example to it:
            \`\`\`
            "prisma": {
              "seed": "node custom-folder/seed.js"
            }
            \`\`\`

            More information in our documentation:
            https://pris.ly/d/seeding
          `)
    expect(
      ctx.mocked['console.info'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
    expect(
      ctx.mocked['console.error'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
  })

  it('custom ts-node should warn', async () => {
    ctx.fixture('seed-sqlite-legacy-custom-ts-node')

    const result = DbSeed.new().parse([])
    await expect(result).rejects.toMatchInlineSnapshot(`
            To configure seeding in your project you need to add a "prisma.seed" property in your package.json with the command to execute it:

            1. Open the package.json of your project
            2. Add the following example to it:
            \`\`\`
            "prisma": {
              "seed": "ts-node prisma/seed.ts"
            }
            \`\`\`

            3. Install the required dependencies by running:
            npm i -D ts-node typescript @types/node

            More information in our documentation:
            https://pris.ly/d/seeding
          `)
    expect(
      ctx.mocked['console.info'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(``)
    expect(
      ctx.mocked['console.warn'].mock.calls.join('\n'),
    ).toMatchInlineSnapshot(
      `prisma:warn The "ts-node" script in the package.json is not used anymore since version 3.0 and can now be removed.`,
    )
    expect(ctx.mocked['console.error'].mock.calls.join()).toMatchInlineSnapshot(
      ``,
    )
  })
})
