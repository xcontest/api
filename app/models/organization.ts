import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import JuryMember from '#models/jury_member'
import Sponsor from '#models/sponsor'

export default class Organization extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare logoUrl: string | null

  @column()
  declare websiteUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => JuryMember)
  declare juryMembers: HasMany<typeof JuryMember>

  @hasMany(() => Sponsor)
  declare sponsors: HasMany<typeof Sponsor>

  @beforeCreate()
  static assignUuid(organization: Organization) {
    organization.id = randomUUID()
  }
}
