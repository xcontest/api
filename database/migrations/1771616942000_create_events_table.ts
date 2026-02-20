import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.string('slug').notNullable().unique()
      table.string('title').notNullable()
      table.text('description').notNullable()
      table.string('access_code').nullable()
      table.enum('status', ['DRAFT', 'ACTIVE', 'ARCHIVED']).notNullable().defaultTo('DRAFT')
      table.integer('min_team_size').notNullable()
      table.integer('max_team_size').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
