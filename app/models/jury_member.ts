import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Task from '#models/task'
import Organization from '#models/organization'
import HumanScore from '#models/human_score'

export default class JuryMember extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare description: string

  @column()
  declare userId: number

  @column()
  declare taskId: string

  @column()
  declare organizationId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Task)
  declare task: BelongsTo<typeof Task>

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @hasMany(() => HumanScore)
  declare humanScores: HasMany<typeof HumanScore>

  @beforeCreate()
  static assignUuid(juryMember: JuryMember) {
    juryMember.id = randomUUID()
  }
}
