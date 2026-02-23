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
import { BaseModel, beforeCreate, beforeSave, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'
import User from '#models/user'

export default class TeamInvitation extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare inviterId: number

  @column()
  declare inviteeEmail: string | null

  @column()
  declare token: string

  @column({})
  declare status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'FAILED' | 'EXPIRED'

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => User, { foreignKey: 'inviterId' })
  declare inviter: BelongsTo<typeof User>

  @beforeCreate()
  static assignUuid(invitation: TeamInvitation) {
    invitation.id = randomUUID()
    invitation.status ??= 'PENDING'
  }

  @beforeSave()
  static async cleanupExpiration(invitation: TeamInvitation) {
    if (invitation.status !== 'PENDING')
      invitation.expiresAt = null
  }

  public static async fetchTeamSyncExpirations(team: Team) {
    const now = DateTime.now().toSQL()

    // Yeah, maybe we should introduce caching to our app?
    await this.query()
      .where('team_id', team.id)
      .where('status', 'PENDING')
      .where('expires_at', '<', now)
      .update({ status: 'EXPIRED' })

    return this.query().where('team_id', team.id)
  }

  public static async syncUserExpirations(user: User) {
    const now = DateTime.now().toSQL()

    // Yeah, maybe we should introduce caching to our app?
    await this.query()
      .where('invitee_email', user.email)
      .where('status', 'PENDING')
      .where('expires_at', '<', now)
      .update({ status: 'EXPIRED' })
  }
}
