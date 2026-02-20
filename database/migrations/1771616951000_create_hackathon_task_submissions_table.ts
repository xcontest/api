import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'hackathon_task_submissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table
        .uuid('task_registration_id')
        .notNullable()
        .references('id')
        .inTable('task_registrations')
        .onDelete('CASCADE')
      table.text('description').nullable()
      table.string('repository_url').nullable()
      table
        .enum('status', ['DRAFT', 'ACTIVE', 'ARCHIVED'])
        .notNullable()
        .defaultTo('DRAFT')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
