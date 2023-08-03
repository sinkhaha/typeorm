import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { ExampleEntity } from "./entity/ExampleEntity"
import { expect } from "chai"

describe("github issues > #9991", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [ExampleEntity],
            enabledDrivers: ["mysql"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("add table comment", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const sql =
                    'SELECT table_comment FROM information_schema.tables WHERE table_name = "example"'
                const rst = await dataSource.manager.query(sql)
                expect(rst[0] && rst[0].TABLE_COMMENT).to.be.eq(
                    "this is table comment",
                )
            }),
        )
    })

    it("should correctly change table comment", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("example")

                await queryRunner.changeTableComment(
                    table!,
                    "this is new table comment",
                )

                const sql =
                    'SELECT table_comment FROM information_schema.tables WHERE table_name = "example"'
                let rst = await dataSource.manager.query(sql)

                expect(rst[0] && rst[0].TABLE_COMMENT).to.be.eq(
                    "this is new table comment",
                )

                await queryRunner.release()
            }),
        )
    })

    it("should correctly synchronize when table comment change", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                const exampleMetadata = dataSource.getMetadata(ExampleEntity)
                exampleMetadata.comment = "change table comment"

                await dataSource.synchronize()

                const sql =
                    'SELECT table_comment FROM information_schema.tables WHERE table_name = "example"'
                let rst = await dataSource.manager.query(sql)

                expect(rst[0] && rst[0].TABLE_COMMENT).to.be.eq(
                    "change table comment",
                )

                await queryRunner.release()
            }),
        )
    })
})
