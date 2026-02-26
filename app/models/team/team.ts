/*
 *          ______            __            __
 *    _  __/ ____/___  ____  / /____  _____/ /_
 *   | |/_/ /   / __ \/ __ \/ __/ _ \/ ___/ __/
 *  _>  </ /___/ /_/ / / / / /_/  __(__  ) /_
 * /_/|_|\____/\____/_/ /_/\__/\___/____/\__/
 *     Copyright (C) 2026 xContest Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 *
 */

import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Event from '#models/event/event'
import TeamMember from '#models/team/team_member'
import TeamInvitation from '#models/team/team_invitation'
import TaskRegistration from '#models/task/task_registration'
import { ApiColumn } from '#openapi/decorators'

export default class Team extends BaseModel {
  @column({ isPrimary: true })
  @ApiColumn(String, { example: 'd62a1715-6b7a-4b40-8bdd-4a10f2ceb08c' })
  declare id: string

  @column()
  @ApiColumn(String, { example: 'd62a1715-6b7a-4b40-8bdd-4a10f2ceb08c' })
  declare eventId: string

  @column()
  @ApiColumn(String, { example: 'Team Awesome' })
  declare name: string

  @column.dateTime({ autoCreate: true })
  @ApiColumn(String, { format: 'date-time' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  @ApiColumn(String, { format: 'date-time' })
  declare updatedAt: DateTime | null

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @hasMany(() => TeamMember)
  declare members: HasMany<typeof TeamMember>

  @hasMany(() => TeamInvitation)
  declare invitations: HasMany<typeof TeamInvitation>

  @hasMany(() => TaskRegistration)
  declare taskRegistrations: HasMany<typeof TaskRegistration>

  @beforeCreate()
  static assignUuid(team: Team) {
    team.id = randomUUID()
  }
}
