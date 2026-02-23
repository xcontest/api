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

import type {HttpContext} from '@adonisjs/core/http'
import {
  createTeamValidator,
  teamInvitationResponseValidator,
  teamInvitationValidator,
  updateTeamValidator,
} from '#validators/team'
import Team from "#models/team/team";
import Event from '#models/event/event';
import TeamPolicy from "#policies/team_policy";
import db from "@adonisjs/lucid/services/db";
import {TeamMemberGuard} from '#utils/permissions'
import EventPolicy from "#policies/event_policy";
import {commonQueryValidator, confirmationValidator, paramsIdValidator} from '#validators/common'
import {applyQueryFilters} from "#utils/query";
import Task from '#models/task/task';
import {generateMemorableToken, generateSecureToken, invitationValidity} from "#utils/teams";
import TeamInvitation from "#models/team/team_invitation";
import InvitationSent from "#events/invitation_sent";

export default class TeamsController {
  /**
   * Display a list of resource
   */
  async index({ bouncer, params, request }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.event_id)
    const query = await request.validateUsing(commonQueryValidator, {
      data: request.qs()
    })
    await bouncer.with(EventPolicy).authorize('view', event)

    return applyQueryFilters(
      event.related('teams').query(),
      query,
      { request, searchColumn: 'name' }
    )
  }

  /**
   * Handle form submission for the creation action
   */
  async store({ auth, bouncer, params, request, response }: HttpContext) {
    const { accessCode, ...payload } = await request.validateUsing(createTeamValidator)
    const event = await Event.findByUuidOrSlug(params.event_id)
    await bouncer.with(TeamPolicy).authorize('create', event, accessCode)

    const team = await db.transaction(async (trx) => {
      const newTeam = await event.related('teams').create(payload, { client: trx })

      // Add creating user as team admin
      await newTeam.related('members').create(
        {
          userId: auth.getUserOrFail().id,
          permissions: TeamMemberGuard.allPermissions(),
        },
        { client: trx }
      )

      // Autoregister to tasks
      const autoregisterTasks = await Task.query()
        .where('event_id', event.id)
        .where('autoregister', true)

      for(const task of autoregisterTasks) {
        await task.related('registrations').create({
          teamId: newTeam.id,
        }, { client: trx })
      }

      return newTeam
    })

    return response.created(team)
  }

  /**
   * Show individual record
   */
  async show({ bouncer, request }: HttpContext) {
    const { params } = await request.validateUsing(paramsIdValidator)
    const team = await Team.findOrFail(params.id)
    const event = await team.related('event').query().firstOrFail()
    await bouncer.with(EventPolicy).authorize('view', event)
    await team.load('members')
    return team
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ bouncer, request }: HttpContext) {
    const { params } = await request.validateUsing(paramsIdValidator)
    const team = await Team.findOrFail(params.id)
    const payload = await request.validateUsing(updateTeamValidator, {
      meta: { teamName: team.name }
    })

    await bouncer.with(TeamPolicy).authorize('edit', team)

    team.merge(payload)
    await team.save()

    return team
  }

  /**
   * Delete record
   */
  async destroy({ bouncer, request, response }: HttpContext) {
    const { params } = await request.validateUsing(paramsIdValidator)
    const team = await Team.findOrFail(params.id)
    await request.validateUsing(confirmationValidator, {
      meta: {
        expectedConfirmation: team.name,
        confirmationMeta: 'team name'
      },
    })

    await bouncer.with(TeamPolicy).authorize('edit', team)

    await team.delete()
    return response.noContent()
  }

  // Create a new invite
  async invite({ auth, bouncer, request }: HttpContext) {
    const { params } = await request.validateUsing(paramsIdValidator)
    const team = await Team.findOrFail(params.id)
    const payload = await request.validateUsing(teamInvitationValidator)
    await bouncer.with(TeamPolicy).allows('invite', team, payload.email)

    const invitation = await team.related('invitations').create({
      inviterId: auth.getUserOrFail().id,
      inviteeEmail: payload.email,
      token: payload.email ? generateSecureToken() : generateMemorableToken(),
      expiresAt: invitationValidity[payload.validFor as keyof typeof invitationValidity](),
    })
    await InvitationSent.dispatch(invitation)
    return invitation
  }

  // List all invites for the team
  async indexInvites({ bouncer, request }: HttpContext) {
    const { params } = await request.validateUsing(paramsIdValidator)
    const team = await Team.findOrFail(params.id)
    await bouncer.with(TeamPolicy).allows('edit', team)

    return TeamInvitation.fetchSyncExpirations(team)
  }

  // Accept/Decline an invitation
  async respondToInvite({ auth, bouncer, request }: HttpContext) {
    const { action, params } = await request.validateUsing(teamInvitationResponseValidator)
    const invitation = await TeamInvitation.findByOrFail('token', params.id)
    await bouncer.with(TeamPolicy).authorize('respondToInvitation', invitation)

    const user = auth.getUserOrFail()
    const member = await db.transaction(async (trx) => {
      invitation.useTransaction(trx)
      invitation.status = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED'
      await invitation.save()

      if (invitation.status === 'ACCEPTED') {
        const team = await invitation.related('team').query().firstOrFail()
        return await team.related('members').create(
          {
            userId: user.id,
            // No permissions by default, admin must update them after the user joins.
            permissions: TeamMemberGuard.build(),
          },
          { client: trx }
        )
      }
    })

    return {
      invitation,
      member
    }
  }
}
