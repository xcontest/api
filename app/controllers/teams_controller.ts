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

import type { HttpContext } from '@adonisjs/core/http'
import {
  createTeamValidator,
  kickMemberValidator,
  teamInvitationResponseValidator,
  teamInvitationValidator,
  updateTeamValidator,
} from '#validators/team'
import Team from '#models/team/team'
import Event from '#models/event/event'
import TeamPolicy from '#policies/team_policy'
import db from '@adonisjs/lucid/services/db'
import { TeamMemberGuard } from '#utils/permissions'
import EventPolicy from '#policies/event_policy'
import { commonQueryValidator, confirmationValidator, paramsIdValidator } from '#validators/common'
import { applyQueryFilters } from '#utils/query'
import Task from '#models/task/task'
import { generateMemorableToken, generateSecureToken, invitationValidity } from '#utils/teams'
import TeamInvitation from '#models/team/team_invitation'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import { ApiOperation, ApiRequest, ApiResponse } from '#openapi/decorators'
import { merged, paginated } from '#openapi/tools'
import TeamMember from '#models/team/team_member'

export default class TeamsController {
  @ApiOperation({ description: 'Get a list of teams for an event' })
  @ApiRequest({ validator: commonQueryValidator })
  @ApiResponse(200, { description: 'A list of teams', data: paginated(Team) })
  @ApiResponse(403, { description: 'Missing permission to view this event' })
  async index({ bouncer, params, request, response }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.event_id)
    await bouncer.with(EventPolicy).authorize('view', event)

    return applyQueryFilters(event.related('teams').query(), {
      request,
      response,
      searchColumn: 'name',
      allowedColumns: ['name', 'created_at'],
    })
  }

  @ApiOperation({ description: 'Create a new team in an event' })
  @ApiRequest({ validator: createTeamValidator, withResponse: true })
  @ApiResponse(201, { description: 'The newly created team', data: Team })
  @ApiResponse(403, { description: 'Missing permission or invalid access code' })
  async store({ auth, bouncer, params, request, response }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.event_id)
    const { accessCode, ...payload } = await request.validateUsing(createTeamValidator, {
      meta: { eventId: event.id },
    })
    await bouncer.with(TeamPolicy).authorize('create', event, accessCode)

    const team = await db.transaction(async (trx) => {
      const newTeam = await event.related('teams').create(payload, { client: trx })

      // Add creating user as team admin
      await newTeam.related('members').create(
        {
          userId: auth.getUserOrFail().id,
          permissions: TeamMemberGuard.allPermissions(),
        },
        { client: trx },
      )

      // Autoregister to tasks
      const autoregisterTasks = await Task.query()
        .where('event_id', event.id)
        .where('autoregister', true)

      for (const task of autoregisterTasks)
        await task.related('registrations').create(
          {
            teamId: newTeam.id,
          },
          { client: trx },
        )

      return newTeam
    })

    return response.created(team)
  }

  @ApiOperation({ description: 'Get a specific team by ID' })
  @ApiResponse(200, {
    description: 'The requested team',
    data: merged(Team, { members: [TeamMember] }),
  })
  @ApiResponse(404, { description: 'Team not found' })
  @ApiResponse(403, { description: 'Missing permission to view this event' })
  async show({ bouncer, request }: HttpContext) {
    const { params } = await request.validateUsing(paramsIdValidator)
    const team = await Team.findOrFail(params.id)
    const event = await team.related('event').query().firstOrFail()
    await bouncer.with(EventPolicy).authorize('view', event)
    await team.load('members')
    return team
  }

  @ApiOperation({ description: 'Update a team by ID' })
  @ApiRequest({ validator: updateTeamValidator, withResponse: true })
  @ApiResponse(200, { description: 'The updated team', data: Team })
  @ApiResponse(404, { description: 'Team not found' })
  @ApiResponse(403, { description: 'Missing permission to edit this team' })
  async update({ bouncer, request }: HttpContext) {
    const { params } = await request.validateUsing(paramsIdValidator)
    const team = await Team.findOrFail(params.id)
    const payload = await request.validateUsing(updateTeamValidator, {
      meta: {
        teamName: team.name,
        eventId: team.eventId,
      },
    })

    await bouncer.with(TeamPolicy).authorize('edit', team)

    team.merge(payload)
    await team.save()

    return team
  }

  @ApiOperation({ description: 'Delete a team by ID. Requires confirmation of the team name.' })
  @ApiRequest({ validator: confirmationValidator, withResponse: true })
  @ApiResponse(204, { description: 'Team deleted successfully' })
  @ApiResponse(404, { description: 'Team not found' })
  @ApiResponse(403, { description: 'Missing permission to delete this team' })
  async destroy({ bouncer, request, response }: HttpContext) {
    const { params } = await request.validateUsing(paramsIdValidator)
    const team = await Team.findOrFail(params.id)
    await request.validateUsing(confirmationValidator, {
      meta: {
        expectedConfirmation: team.name,
        confirmationMeta: 'team name',
      },
    })

    await bouncer.with(TeamPolicy).authorize('edit', team)

    await team.delete()
    return response.noContent()
  }

  @ApiOperation({ description: 'Kick a member from a team' })
  @ApiRequest({ validator: kickMemberValidator, withResponse: true })
  @ApiResponse(204, { description: 'Team member removed successfully' })
  @ApiResponse(404, { description: 'Team or member not found' })
  @ApiResponse(403, { description: 'Missing permission to kick this member' })
  async kickMember({ bouncer, request, response }: HttpContext) {
    const { member, params } = await request.validateUsing(kickMemberValidator)
    const team = await Team.findOrFail(params.id)
    await bouncer.with(TeamPolicy).authorize('kick', team, member)

    await team.related('members').query().where('id', member).delete()
    return response.noContent()
  }

  @ApiOperation({ description: 'Create a new team invitation' })
  @ApiRequest({ validator: teamInvitationValidator, withResponse: true })
  @ApiResponse(201, { description: 'The newly created invitation', data: TeamInvitation })
  @ApiResponse(404, { description: 'Team not found' })
  @ApiResponse(403, { description: 'Missing permission to invite to this team' })
  async storeInvite({ auth, bouncer, request }: HttpContext) {
    const { params } = await request.validateUsing(paramsIdValidator)
    const team = await Team.findOrFail(params.id)
    const payload = await request.validateUsing(teamInvitationValidator)
    await bouncer.with(TeamPolicy).authorize('invite', team, payload.email)

    const invitation = await team.related('invitations').create({
      inviterId: auth.getUserOrFail().id,
      inviteeEmail: payload.email,
      token: payload.email ? generateSecureToken() : generateMemorableToken(),
      expiresAt: invitationValidity[payload.validFor as keyof typeof invitationValidity](),
    })
    if (invitation.inviteeEmail) {
      await invitation.load('inviter')
      await invitation.load('team')
      await invitation.team.load('event')

      const { inviter, team: invitedTeam } = invitation
      const event = invitedTeam.event
      const baseUrl = env.get('WEBSITE')

      await mail.sendLater((message) => {
        message
          .to(invitation.inviteeEmail!)
          .subject("You've been invited!")
          .htmlView('events/invite', {
            invitee: { name: invitation.inviteeEmail },
            inviter: {
              name:
                [inviter.name, inviter.surname].filter(Boolean).join(' ') || inviter.nickname,
            },
            event: {
              title: event.title,
              date: event.createdAt?.toISODate() ?? '',
              description: event.description,
              location: 'TBD', //! Event location should be added to the event model.
            },
            team: { name: invitedTeam.name },
            inviteLink: `${baseUrl}/invitations/${invitation.id}?token=${invitation.token}`,
            unsubscribeLink: `${baseUrl}/unsubscribe`,
          })
      })
    }
    return invitation
  }

  @ApiOperation({ description: 'Get a list of team invitations for a team' })
  @ApiResponse(200, { description: 'A list of team invitations', data: [TeamInvitation] })
  @ApiResponse(404, { description: 'Team not found' })
  @ApiResponse(403, { description: 'Missing permission to edit this team' })
  async indexInvites({ bouncer, request }: HttpContext) {
    const { params } = await request.validateUsing(paramsIdValidator)
    const team = await Team.findOrFail(params.id)
    await bouncer.with(TeamPolicy).authorize('edit', team)

    return TeamInvitation.fetchTeamSyncExpirations(team)
  }

  @ApiOperation({ description: 'Get a list of pending team invitations for the current user' })
  @ApiRequest({ validator: commonQueryValidator })
  @ApiResponse(200, {
    description: 'A list of team invitations for the user',
    data: paginated(TeamInvitation),
  })
  async indexUserInvites({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await TeamInvitation.syncUserExpirations(user)
    return applyQueryFilters(
      TeamInvitation.query()
        .preload('team')
        .where('invitee_email', user.email)
        .leftJoin('teams', 'team_invitations.team_id', 'teams.id'),
      {
        request,
        response,
        searchColumn: 'teams.name',
        allowedColumns: ['created_at', 'teams.name', 'token'],
        defaultTable: 'team_invitations',
      },
    )
  }

  @ApiOperation({ description: 'Accept or decline a team invitation' })
  @ApiRequest({ validator: teamInvitationResponseValidator, withResponse: true })
  @ApiResponse(200, {
    description: 'Invitation responded successfully',
    data: { invitation: TeamInvitation, member: TeamMember },
  })
  @ApiResponse(404, { description: 'Invitation not found' })
  @ApiResponse(403, { description: 'Missing permission to respond to this invitation' })
  async respondToInvite({ auth, bouncer, request, response }: HttpContext) {
    const { qs, params } = await request.validateUsing(teamInvitationResponseValidator, {
      data: {
        qs: request.qs(),
        params: request.params(),
      },
    })
    const action = qs.action as 'ACCEPT' | 'DECLINE' | undefined
    const invitation = await TeamInvitation.query()
      .where('token', params.id)
      .orderByRaw("CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END ASC")
      .firstOrFail()
    await bouncer.with(TeamPolicy).authorize('respondToInvitation', invitation)

    const user = auth.getUserOrFail()
    const member = await db.transaction(async (trx) => {
      invitation.useTransaction(trx)
      invitation.status = !action || action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED'
      await invitation.save()

      if (invitation.status === 'ACCEPTED') {
        const team = await invitation.related('team').query().firstOrFail()
        return team.related('members').create(
          {
            userId: user.id,
            // No permissions by default, admin must update them after the user joins.
            permissions: TeamMemberGuard.build(),
          },
          { client: trx },
        )
      }
    })

    return response
      .safeHeader('Location', new URL(`/teams/${invitation.teamId}`, env.get('WEBSITE')).toString())
      .ok({
        invitation,
        member,
      })
  }
}
