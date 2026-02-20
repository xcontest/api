import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('nickname').notNullable()
      table.string('name').nullable()
      table.string('surname').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('avatar_url').nullable()
      table.integer('permissions').notNullable()
      table.string('password').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}