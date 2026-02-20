import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import JuryMember from '#models/jury_member'
import HackathonSubmissionResult from '#models/hackathon_submission_result'
import ScoringCriterion from '#models/scoring_criterion'

export default class HumanScore extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare juryMemberId: string

  @column()
  declare submissionResultId: string

  @column()
  declare criterionId: string

  @column()
  declare score: number

  @column()
  declare description: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => JuryMember)
  declare juryMember: BelongsTo<typeof JuryMember>

  @belongsTo(() => HackathonSubmissionResult, { foreignKey: 'submissionResultId' })
  declare submissionResult: BelongsTo<typeof HackathonSubmissionResult>

  @belongsTo(() => ScoringCriterion, { foreignKey: 'criterionId' })
  declare criterion: BelongsTo<typeof ScoringCriterion>

  @beforeCreate()
  static assignUuid(score: HumanScore) {
    score.id = randomUUID()
  }
}
