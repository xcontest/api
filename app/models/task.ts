import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Event from '#models/event'
import HackathonTask from '#models/hackathon_task'
import ScoringCriterion from '#models/scoring_criterion'
import TaskRegistration from '#models/task_registration'
import JuryMember from '#models/jury_member'
import Sponsor from '#models/sponsor'

export default class Task extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare eventId: string

  @column()
  declare slug: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare taskType: 'HACKATHON' | 'CTF' | 'ALGO'

  @column()
  declare status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

  @column()
  declare autoregister: boolean

  @column.dateTime()
  declare resultsPublishedAt: DateTime | null

  @column.dateTime()
  declare registrationStartAt: DateTime | null

  @column.dateTime()
  declare registrationEndAt: DateTime | null

  @column.dateTime()
  declare detailsRevealAt: DateTime | null

  @column.dateTime()
  declare submissionsStartAt: DateTime | null

  @column.dateTime()
  declare submissionsEndAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @hasOne(() => HackathonTask)
  declare hackathonTask: HasOne<typeof HackathonTask>

  @hasMany(() => ScoringCriterion)
  declare scoringCriteria: HasMany<typeof ScoringCriterion>

  @hasMany(() => TaskRegistration)
  declare registrations: HasMany<typeof TaskRegistration>

  @hasMany(() => JuryMember)
  declare juryMembers: HasMany<typeof JuryMember>

  @hasMany(() => Sponsor)
  declare sponsors: HasMany<typeof Sponsor>

  @beforeCreate()
  static assignUuid(task: Task) {
    task.id = randomUUID()
  }
}
