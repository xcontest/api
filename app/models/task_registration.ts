import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Team from '#models/team'
import Task from '#models/task'
import HackathonTaskSubmission from '#models/hackathon_task_submission'

export default class TaskRegistration extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare taskId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => Task)
  declare task: BelongsTo<typeof Task>

  @hasMany(() => HackathonTaskSubmission)
  declare hackathonSubmissions: HasMany<typeof HackathonTaskSubmission>

  @beforeCreate()
  static assignUuid(registration: TaskRegistration) {
    registration.id = randomUUID()
  }
}
