import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE')
      table.string('slug').notNullable().unique()
      table.string('title').notNullable()
      table.text('description').notNullable()
      table
        .enum('task_type', ['HACKATHON', 'CTF', 'ALGO'])
        .notNullable()
      table
        .enum('status', ['DRAFT', 'ACTIVE', 'ARCHIVED'])
        .notNullable()
        .defaultTo('DRAFT')
      table.boolean('autoregister').notNullable().defaultTo(false)
      table.timestamp('results_published_at').nullable()
      table.timestamp('registration_start_at').nullable()
      table.timestamp('registration_end_at').nullable()
      table.timestamp('details_reveal_at').nullable()
      table.timestamp('submissions_start_at').nullable()
      table.timestamp('submissions_end_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
