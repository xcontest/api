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

import { BaseModel, column } from '@adonisjs/lucid/orm'
import { ApiColumn, ResponseDataType } from './decorators.js'
import { _ApiWrappedData } from './index.js'

export const paginated = (data: ResponseDataType) => ({
  meta: PaginationMeta,
  data: [data],
})

export const merged = (...objects: ResponseDataType[]): ResponseDataType =>
  new _ApiWrappedData(objects, (values) => ({ allOf: values }))

export const alternative = (...objects: ResponseDataType[]): ResponseDataType =>
  new _ApiWrappedData(objects, (values) => ({ oneOf: values }))

// A bit of a hacky solution to ensure metadata is represented as
// a single model and not inserted every time as a schema
// THIS TABLE SHOULD NOT BE IN A DATABASE!!! IT IS FOR OPENAPI SPEC ONLY
class PaginationMeta extends BaseModel {
  static table = 'pagination_meta_not_put_in_a_database'

  @column()
  @ApiColumn(Number)
  declare total: null

  @column()
  @ApiColumn(Number, { example: 25 })
  declare perPage: null

  @column()
  @ApiColumn(Number)
  declare currentPage: null

  @column()
  @ApiColumn(Number, { example: 3 })
  declare lastPage: null

  @column()
  @ApiColumn(Number)
  declare firstPage: null

  @column()
  @ApiColumn(String, { example: '/data?page=1' })
  declare firstPageUrl: null

  @column()
  @ApiColumn(String, { example: '/data?page=3' })
  declare lastPageUrl: null

  @column()
  @ApiColumn(String, { required: false, example: '/data?page=2' })
  declare nextPageUrl: null

  @column()
  @ApiColumn(String, { required: false, example: null })
  declare previousPageUrl: null
}
