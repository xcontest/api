import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'human_scores'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table
        .uuid('jury_member_id')
        .notNullable()
        .references('id')
        .inTable('jury_members')
        .onDelete('CASCADE')
      table
        .uuid('submission_result_id')
        .notNullable()
        .references('id')
        .inTable('hackathon_submission_results')
        .onDelete('CASCADE')
      table
        .uuid('criterion_id')
        .notNullable()
        .references('id')
        .inTable('scoring_criteria')
        .onDelete('CASCADE')
      table.double('score').notNullable()
      table.text('description').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
