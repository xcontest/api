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

import factory from '@adonisjs/lucid/factories'
import Team from '#models/team/team'
import TeamMember from "#models/team/team_member";
import { TeamMemberGuard } from "#utils/permissions";
import { UserFactory } from "#database/factories/user_factory";
import Event from "#models/event/event";

export const TeamFactory = factory
  .define(Team, async ({ faker }) => ({
    // eslint-disable-next-line @unicorn/no-await-expression-member
    eventId: (await Event.findByOrFail('slug', 'no-tasks')).id,
    name: faker.company.name(),
  }))
  .relation('members', () => TeamMemberFactory)
  .after('create', async (_, { members }) => {
    if (members.length > 0)
      // Set the first member to be an admin
      members[0].permissions = TeamMemberGuard.allPermissions()
    await members[0].save()
  })
  .build()

export const TeamMemberFactory = factory
  .define(TeamMember, async ({ }) => ({
    permissions: TeamMemberGuard.build(),
  }))
  .relation('user', () => UserFactory)
  .build()
