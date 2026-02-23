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

import {commonQueryValidator} from '#validators/common'
import {ModelQueryBuilderContract} from "@adonisjs/lucid/types/model";
import type {Request, Response} from '@adonisjs/core/http';

/**
 * Applies common filters (search, sorting, status, filter) to any Lucid query
 * Filters have custom syntax which look like this: ?filter[]=teams.name:~Ball (equal to teams.name LIKE '%Ball%')
 */
export async function applyQueryFilters<Q extends ModelQueryBuilderContract<any>>(
  query: Q,
  {
    request,
    response,
    searchColumn,
    defaultPageSize = 25,
    allowedColumns = [],
    defaultTable
  }: {
    request: Request,
    response: Response,
    searchColumn: string
    defaultPageSize?: number,
    allowedColumns?: string[],
    defaultTable?: string
  }
) {
  const params = await request.validateUsing(commonQueryValidator, {
    data: request.qs(),
  })

  // Search query
  if (params.search)
    query = query.whereLike(searchColumn, `%${params.search}%`)

  // Dynamic sorting
  if (params.orderBy && allowedColumns.length > 0) {
    if (!allowedColumns.includes(params.orderBy))
      return response.unprocessableEntity({
        errors: [
          {
            message: 'Invalid sort column',
            field: 'orderBy',
            allowedColumns
          }
        ]
      })
    if (defaultTable && !params.orderBy.includes('.'))
      params.orderBy = `${defaultTable}.${params.orderBy}`
    query = query.orderBy(params.orderBy!, params.orderDirection ?? 'asc')
  }

  // Filters
  if (params.filter)
    for (const item of params.filter) {
      const colonIndex = item.indexOf(':')
      let key = item.substring(0, colonIndex).trim()
      let value = item.substring(colonIndex + 1).trim()

      if (!allowedColumns.includes(key))
        return response.unprocessableEntity({
          errors: [
            {
              message: 'Invalid filter column',
              field: 'filter',
              column: key,
              allowedColumns
            }
          ]
        })

      if (defaultTable && !key.includes('.'))
        key = `${defaultTable}.${key}`

      // Supported filter operators
      const operators: Record<string, string> = {
        '>=': '>=',
        '<=': '<=',
        '>': '>',
        '<': '<',
        '!': '!=',
        '~': 'LIKE'
      }

      // Determine which operator to use
      let selectedOp = '='
      for (const op in operators)
        if (value.startsWith(op)) {
          selectedOp = operators[op]
          value = value.substring(op.length).trim() // Remove operator from value
          if (selectedOp === 'LIKE')
            value = `%${value}%`
          break
        }

      // Apply operator to query
      if (value.toLowerCase() === 'null') {
        if (selectedOp !== '!=' && selectedOp !== '=')
          return response.unprocessableEntity(
            {errors: [{message: 'Invalid filter operator for null value', field: 'filter'}]},
          )
        selectedOp === '!=' ? query.whereNotNull(key) : query.whereNull(key)
      } else // TODO: Figure out how to validate the value based on the column type to not throw 5xx errors
        query.where(key, selectedOp, value)
      console.log(query.toSQL())
    }

  // Pagination
  const paginated = await query.paginate(params.page || 1, params.limit || defaultPageSize)
  return paginated.baseUrl(request.url(false)).queryString(request.qs())
}
