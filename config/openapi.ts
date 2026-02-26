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

import type { ApiSpecGeneratorConfig } from '#openapi/index'
import path from 'node:path'

const openapiConfig: ApiSpecGeneratorConfig = {
  hideDefaultTag: true,
  info: {
    title: 'xContest REST API',
    description: 'Specification document for REST API component of xContest platform',
    version: '1.0.0', // TODO: Get this from package?
  },
  output: {
    directory: path.join(import.meta.dirname, '../docs/spec'),
    emitHtml: true,
    htmlConfig: {
      url: '/spec/openapi.json',
      title: 'xContest REST API',
      theme: 'purple',
      darkMode: true,
    },
  },
}

export default openapiConfig
