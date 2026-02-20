import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Team from '#models/team'
import User from '#models/user'

export default class TeamInvitation extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare inviterId: number

  @column()
  declare inviteeEmail: string

  @column()
  declare token: string

  @column()
  declare status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'FAILED' | 'EXPIRED'

  @column.dateTime()
  declare expiresAt: DateTime

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
  }
}
