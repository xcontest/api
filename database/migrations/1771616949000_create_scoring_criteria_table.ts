import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'scoring_criteria'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.uuid('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE')
      table.string('category').notNullable()
      table.text('description').nullable()
      table.double('maximum_score').notNullable()
      table.double('weight').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
