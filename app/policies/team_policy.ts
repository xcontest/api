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

import type User from '#models/user'
import type Event from '#models/event/event'
import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { TeamMemberGuard, UserGuard } from '#utils/permissions'
import type Team from '#models/team/team'
import type TeamInvitation from '#models/team/team_invitation'
import { DateTime } from 'luxon'
import TeamMember from '#models/team/team_member'

export default class TeamPolicy extends BasePolicy {
  // Whether a user can create a new team for an event
  create(user: User, event: Event, accessCode: string | undefined): AuthorizerResponse {
    if (!UserGuard.can(user, 'CREATE_TEAM'))
      return false

    return event.accessCode === null || event.accessCode === accessCode
  }

  // Whether user can edit team information
  async edit(user: User, team: Team): Promise<AuthorizerResponse> {
    if (UserGuard.can(user, 'MANAGE_ALL_TEAMS'))
      return true

    const member = await team.related('members').query().where('user_id', user.id).first()
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

  async kick(user: User, team: Team, targetMemberId: string): Promise<AuthorizerResponse> {
    const member = await TeamMember.findOrFail(targetMemberId)
    if (TeamMemberGuard.can(member, 'IS_OWNER'))
      return AuthorizationResponse.deny(
        'Owner cannot be kicked or leave. Please delete the team or transfer ownership to another user.',
      )

    if (UserGuard.can(user, 'MANAGE_ALL_TEAMS'))
      return true

    return member.userId === user.id || this.edit(user, team)
  }

  async invite(user: User, team: Team, otherUserEmail?: string): Promise<AuthorizerResponse> {
    if (otherUserEmail) {
      const foundMembers = await team.related('members')
        .query()
        .whereHas('user', (query) => {
          query.where('email', otherUserEmail)
        })
        .first()
      if (foundMembers)
        return AuthorizationResponse.deny('User is already a member of this team')
    }

    const members = await team.related('members').query().count('*', 'count').firstOrFail()
    const event = await team.related('event').query().firstOrFail()
    if (members.$extras.count >= event.maxTeamSize)
      return AuthorizationResponse.deny('Team already has maximum number of members')

    return this.edit(user, team)
  }

  // Whether use can respond to an invitation.
  // This can mark an invitation 'FAILED' if it is impossible for someone else to accept it
  // or if the team is full
  async respondToInvitation(user: User, invitation: TeamInvitation): Promise<AuthorizerResponse> {
    const now = DateTime.now()
    if (invitation.status !== 'PENDING')
      return AuthorizationResponse.deny('Invitation is not pending')

    // expiresAt cannot be null if status is 'PENDING' as per table constraints
    if (invitation.expiresAt! < now) {
      invitation.status = 'EXPIRED'
      await invitation.save()
      return AuthorizationResponse.deny('Invitation is expired', 422)
    }

    if (invitation.inviteeEmail && invitation.inviteeEmail !== user.email)
      return AuthorizationResponse.deny('Invitation is not for you')

    const team = await invitation.related('team').query().preload('event').preload('members').firstOrFail()

    const isAlreadyMember = team.members.some((member) => member.userId === user.id)
    if (isAlreadyMember) {
      if (invitation.inviteeEmail) {
        invitation.status = 'FAILED'
        await invitation.save()
      }
      return AuthorizationResponse.deny('You are already a member of this team')
    }

    const isAboveMaxMembers = team.members.length > team.event.maxTeamSize
    if (isAboveMaxMembers) {
      invitation.status = 'FAILED'
      await invitation.save()
      return AuthorizationResponse.deny('Team already has maximum number of members', 422)
    }

    return true
  }
}
