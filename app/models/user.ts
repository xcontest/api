/*
 *          ______            __            __
 *    _  __/ ____/___  ____  / /____  _____/ /_
 *   | |/_/ /   / __ \/ __ \/ __/ _ \/ ___/ __/
 *  _>  </ /___/ /_/ / / / / /_/  __(__  ) /_
 * /_/|_|\____/\____/_/ /_/\__/\___/____/\__/
 *     Copyright (C) 2026 xContest Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 *
 */

import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { UserPermissions, Mask } from '#utils/permissions'
import { ApiColumn } from '../../docs/generator/decorators.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  @ApiColumn(Number)
  declare id: number

  @column()
  @ApiColumn(String, { example: 'JohnnyBravo' })
  declare nickname: string

  @column()
  @ApiColumn(String, { required: false, example: 'John' })
  declare name: string | null

  @column()
  @ApiColumn(String, { required: false, example: 'Bravo' })
  declare surname: string | null

  @column()
  @ApiColumn(String, { example: 'johnny.bravo@example.com' })
  declare email: string

  @column()
  @ApiColumn(String, { required: false, example: 'https://example.com/avatar.png' })
  declare avatarUrl: string | null

  @column()
  @ApiColumn(Number, { format: 'binary' })
  declare permissions: Mask<typeof UserPermissions>

  @column({ serializeAs: null })
  declare password: string | null

  @column.dateTime({ autoCreate: true })
  @ApiColumn(String, { format: 'date-time' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  @ApiColumn(String, { format: 'date-time' })
  declare updatedAt: DateTime | null
}
