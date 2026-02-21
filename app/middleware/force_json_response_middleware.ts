//          ______            __            __
//    _  __/ ____/___  ____  / /____  _____/ /_
//   | |/_/ /   / __ \/ __ \/ __/ _ \/ ___/ __/
//  _>  </ /___/ /_/ / / / / /_/  __(__  ) /_
// /_/|_|\____/\____/_/ /_/\__/\___/____/\__/
//     Copyright (C) 2026 xContest Team

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see http://www.gnu.org/licenses/.

import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Updating the "Accept" header to always accept "application/json" response
 * from the server. This will force the internals of the framework like
 * validator errors or auth errors to return a JSON response.
 */
export default class ForceJsonResponseMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    const headers = request.headers()
    headers.accept = 'application/json'

    return next()
  }
}
