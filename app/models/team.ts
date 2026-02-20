import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Event from '#models/event'
import TeamMember from '#models/team_member'
import TeamInvitation from '#models/team_invitation'
import TaskRegistration from '#models/task_registration'

export default class Team extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare eventId: string

  @column()
  declare name: string

  @column()
  declare inviteCode: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
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
