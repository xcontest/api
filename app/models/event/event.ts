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
import { Exception } from '@adonisjs/core/exceptions'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import EventAdministrator from '#models/event/event_administrator'
import Team from '#models/team/team'
import Task from '#models/task/task'
import Organization from '#models/organization'
import { uuidV4Regex } from '#validators/common'
import { ApiColumn } from '#openapi/decorators'
import vine from '@vinejs/vine'

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  @ApiColumn(String, { example: 'd62a1715-6b7a-4b40-8bdd-4a10f2ceb08c' })
  declare id: string

  @column()
  @ApiColumn(String, { example: 'best-hackathon-ever' })
  declare slug: string

  @column()
  @ApiColumn(String, { example: 'Awesome Hackathon' })
  declare title: string

  @column()
  @ApiColumn(String, { example: 'A first ever hackathon using a modern platform' })
  declare description: string

  @column({ serializeAs: null })
  declare accessCode: string | null

  @column()
  @ApiColumn(vine.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']), { example: 'ACTIVE' })
  declare status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

  @column()
  @ApiColumn(Number)
  declare minTeamSize: number

  @column()
  @ApiColumn(Number, { example: 4 })
  declare maxTeamSize: number

  @column.dateTime({ autoCreate: true })
  @ApiColumn(String, { format: 'date-time' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  @ApiColumn(String, { format: 'date-time' })
  declare updatedAt: DateTime | null

  @hasMany(() => EventAdministrator)
  declare administrators: HasMany<typeof EventAdministrator>

  @hasMany(() => Team)
  declare teams: HasMany<typeof Team>

  @hasMany(() => Task)
  declare tasks: HasMany<typeof Task>

  @hasMany(() => Organization)
  declare organizations: HasMany<typeof Organization>

  @beforeCreate()
  static assignUuid(event: Event) {
    event.id = randomUUID()
  }

  public static async findByUuidOrSlug(value: string) {
    const event = await this.query()
      .where((query) => {
        if (uuidV4Regex.test(value))
          query.where('id', value)
        else
          query.where('slug', value)
      })
      .first()

    if (!event)
      throw new Exception('Event not found', { status: 404, code: 'E_EVENT_NOT_FOUND' })

    return event
  }
}
