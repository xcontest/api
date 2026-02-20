import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'team_invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.integer('inviter_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('invitee_email').notNullable()
      table.string('token').notNullable().unique()
      table
        .enum('status', ['PENDING', 'ACCEPTED', 'DECLINED', 'FAILED', 'EXPIRED'])
        .notNullable()
        .defaultTo('PENDING')
      table.timestamp('expires_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
