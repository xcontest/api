import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import TaskRegistration from '#models/task_registration'
import HackathonSubmissionResult from '#models/hackathon_submission_result'

export default class HackathonTaskSubmission extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare taskRegistrationId: string

  @column()
  declare description: string | null

  @column()
  declare repositoryUrl: string | null

  @column()
  declare status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => TaskRegistration)
  declare taskRegistration: BelongsTo<typeof TaskRegistration>

  @hasOne(() => HackathonSubmissionResult, { foreignKey: 'taskSubmissionId' })
  declare result: HasOne<typeof HackathonSubmissionResult>

  @beforeCreate()
  static assignUuid(submission: HackathonTaskSubmission) {
    submission.id = randomUUID()
  }
}
