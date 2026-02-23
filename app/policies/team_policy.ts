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

import User from '#models/user'
import Event from '#models/event/event'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { TeamMemberGuard, UserGuard } from '#utils/permissions'
import Team from "#models/team/team";

export default class TeamPolicy extends BasePolicy {
  // Whether user can create new team for an event
  create(user: User, event: Event, accessCode: string | undefined): AuthorizerResponse {
    if (!UserGuard.can(user, 'CREATE_TEAM'))
      return false

    return event.accessCode === null || event.accessCode === accessCode
  }

  // Whether user can edit team information
  async edit(user: User, team: Team): Promise<AuthorizerResponse> {
    if (UserGuard.can(user, 'MANAGE_ALL_TEAMS'))
      return true

    const member = await team
      .related('members')
      .query()
      .where('user_id', user.id)
      .first()
    if (!member)
      return false

    return TeamMemberGuard.can(member, 'MANAGE_TEAM')
  }

  async registerToTask(user: User, team: Team): Promise<AuthorizerResponse> {
    if (UserGuard.can(user, 'MANAGE_ALL_TASKS'))
      return true

    const member = await team
      .related('members')
      .query()
      .where('user_id', user.id)
      .first()

    if (!member)
      return false

    return TeamMemberGuard.can(member, 'REGISTER_TASK')
  }
}
