//          ______            __            __
//    _  __/ ____/___  ____  / /____  _____/ /_
//   | |/_/ /   / __ \/ __ \/ __/ _ \/ ___/ __/
//  _>  </ /___/ /_/ / / / / /_/  __(__  ) /_
// /_/|_|\____/\____/_/ /_/\__/\___/____/\__/
//     Copyright (C) 2026 xContest Team

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see http://www.gnu.org/licenses/.

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
