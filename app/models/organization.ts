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
import JuryMember from '#models/hackathon/jury_member'
import Sponsor from '#models/sponsor'
import Event from '#models/event/event'

export default class Organization extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare logoUrl: string | null

  @column()
  declare websiteUrl: string | null

  @column()
  declare eventId: string

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => JuryMember)
  declare juryMembers: HasMany<typeof JuryMember>

  @hasMany(() => Sponsor)
  declare sponsors: HasMany<typeof Sponsor>

  @beforeCreate()
  static assignUuid(organization: Organization) {
    organization.id = randomUUID()
  }

  public static async belongsToEvent(organizationId: string | null | undefined, eventId: string) : Promise<boolean> {
    if (organizationId) {
        const organization = await Organization.findOrFail(organizationId)

        if (organization.eventId !== eventId)
            return false;
    }
    return true;
  }
}
