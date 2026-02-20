import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'task_registrations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.uuid('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE')

      table.timestamp('created_at').notNullable()

      table.unique(['team_id', 'task_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
