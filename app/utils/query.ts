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

import type { commonQuerySchema } from "#validators/common";
import { Infer } from "@vinejs/vine/types";
import {ModelQueryBuilderContract} from "@adonisjs/lucid/types/model";
import type { Request } from '@adonisjs/core/http';

/**
 * Applies common filters (search, sorting, status) to any Lucid query
 */
export async function applyQueryFilters<Q extends ModelQueryBuilderContract<any>>(
  query: Q,
  params: Infer<typeof commonQuerySchema>,
  {
    request,
    searchColumn,
    defaultPageSize = 25,
  }: {
    request: Request
    searchColumn: string
    defaultPageSize?: number
  }
) {
  // Search query
  if (params.search)
    query = query.whereLike(searchColumn, `%${params.search}%`)

  // Dynamic sorting
  if (params.orderBy)
    query = query.orderBy(params.orderBy, params.orderDirection)

  // Pagination
  const paginated = await query.paginate(params.page || 1, params.limit || defaultPageSize)
  return paginated.baseUrl(request.url(false)).queryString(request.qs())
}
