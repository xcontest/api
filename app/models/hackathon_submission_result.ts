import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import HackathonTaskSubmission from '#models/hackathon_task_submission'
import HumanScore from '#models/human_score'

export default class HackathonSubmissionResult extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare taskSubmissionId: string

  @column()
  declare isDisqualified: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => HackathonTaskSubmission, { foreignKey: 'taskSubmissionId' })
  declare submission: BelongsTo<typeof HackathonTaskSubmission>

  @hasMany(() => HumanScore, { foreignKey: 'submissionResultId' })
  declare humanScores: HasMany<typeof HumanScore>

  @beforeCreate()
  static assignUuid(result: HackathonSubmissionResult) {
    result.id = randomUUID()
  }
}
