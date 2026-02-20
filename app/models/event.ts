import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import EventAdministrator from '#models/event_administrator'
import Team from '#models/team'
import Task from '#models/task'

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare slug: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare accessCode: string | null

  @column()
  declare status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

  @column()
  declare minTeamSize: number

  @column()
  declare maxTeamSize: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => EventAdministrator)
  declare administrators: HasMany<typeof EventAdministrator>

  @hasMany(() => Team)
  declare teams: HasMany<typeof Team>

  @hasMany(() => Task)
  declare tasks: HasMany<typeof Task>

  @beforeCreate()
  static assignUuid(event: Event) {
    event.id = randomUUID()
  }
}
