import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.uuid('related_id').notNullable()
      table.string('description').notNullable()
      table.enum('media_type', ['IMAGE', 'VIDEO', 'DOCUMENT', 'LINK']).notNullable()
      table.string('url').notNullable()
      table.integer('gallery_index').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
