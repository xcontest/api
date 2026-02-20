import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Task from '#models/task'
import HumanScore from '#models/human_score'

export default class ScoringCriterion extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare taskId: string

  @column()
  declare category: string

  @column()
  declare description: string | null

  @column()
  declare maximumScore: number

  @column()
  declare weight: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Task)
  declare task: BelongsTo<typeof Task>

  @hasMany(() => HumanScore, { foreignKey: 'criterionId' })
  declare humanScores: HasMany<typeof HumanScore>

  @beforeCreate()
  static assignUuid(criterion: ScoringCriterion) {
    criterion.id = randomUUID()
  }
}
