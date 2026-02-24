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

import { test } from '@japa/runner'
import testUtils from "@adonisjs/core/services/test_utils";
import { InvitationFactory, TeamFactory } from "#database/factories/team_factory";
import Event from "#models/event/event";
import { UserFactory } from "#database/factories/user_factory";
import Team from "#models/team/team";
import User from "#models/user";

declare module '@japa/runner/core' {
  interface TestContext {
    event: Event;
    team: Team;
    teamAdmin: User;
  }
}

test.group('Invitations functionality', (group) => {
  group.each.setup(async ({ context }) => {
    await testUtils.db().seed()
    context.event = await Event.findByOrFail('slug', 'hackathon-tasks')
    context.team = await TeamFactory.with('members', 2, (member) => member.with('user'))
      .merge({ eventId: context.event.id })
      .create()
    context.teamAdmin = context.team.members[0].user
  })
  group.each.teardown(() => testUtils.db().truncate())

  test('Can invite other user via code', async ({ client, assert, team }) => {
    const response = await client.post(`/teams/${team.id}/invites`).json({
      validFor: '1 hour'
    }).loginAs(team.members[0].user)

    response.assertOk()
    assert.isUndefined(response.body().inviteeEmail)
    assert.exists(response.body().token)
  })

  test('Can invite other user via email', async ({ client, assert, team }) => {
    const user = await UserFactory.create()

    const response = await client.post(`/teams/${team.id}/invites`).json({
      email: user.email,
      validFor: '1 hour',
    }).loginAs(team.members[0].user)

    response.assertOk()
    assert.exists(response.body().token)
    response.assertBodyContains({
      inviteeEmail: user.email
    })
  })

  test('Cannot invite without permissions', async ({ client, team }) => {
    const response = await client.post(`/teams/${team.id}/invites`).json({
      validFor: '1 hour',
    }).loginAs(team.members[1].user)

    response.assertForbidden()
  })

  test('Can accept invitation', async ({ client, team, teamAdmin }) => {
    const invitation = await InvitationFactory.merge({ inviterId: teamAdmin.id, teamId: team.id }).create()
    const user = await UserFactory.create()

    const response = await client.get(`/invitations/${invitation.token}`).loginAs(user)

    response.assertOk()
    response.assertBodyContains({
      invitation: {
        status: 'ACCEPTED'
      },
      member: {
        userId: user.id
      }
    })
  })

  test('Can reject invitation', async ({ client, assert, team, teamAdmin }) => {
    const invitation = await InvitationFactory.merge({
      inviterId: teamAdmin.id,
      teamId: team.id,
    }).create()
    const user = await UserFactory.create()

    const response = await client.get(`/invitations/${invitation.token}?action=REJECT`).loginAs(user)

    response.assertOk()
    response.assertBodyContains({
      invitation: {
        status: 'DECLINED',
      }
    })
    assert.isUndefined(response.body().member)
  })

  test("Can accept direct invitation", async ({ client, team, teamAdmin }) => {
    const user = await UserFactory.create()
    const invitation = await InvitationFactory.merge({
      inviteeEmail: user.email,
      inviterId: teamAdmin.id,
      teamId: team.id,
    }).create()

    const response = await client.get(`/invitations/${invitation.token}`).loginAs(user)

    response.assertOk()
    response.assertBodyContains({
      invitation: {
        status: 'ACCEPTED',
      }
    })
  })

  test('Cannot accept someone else\'s invitation', async ({ client, team, teamAdmin }) => {
    const [user1, user2] = await UserFactory.createMany(2)
    const invitation = await InvitationFactory.merge({
      inviteeEmail: user1.email,
      inviterId: teamAdmin.id,
      teamId: team.id,
    }).create()

    const response = await client.get(`/invitations/${invitation.token}?action=REJECT`).loginAs(user2)

    response.assertForbidden()
  })

  test('Can list team invitations', async ({ client, team, teamAdmin }) => {
    const invitations = await InvitationFactory.merge({
      inviterId: teamAdmin.id,
      teamId: team.id
    }).createMany(10)

    const response = await client.get(`/teams/${team.id}/invites`).loginAs(teamAdmin)

    response.assertOk()
    response.assertBodyContains(invitations.map(invitation => ({
      id: invitation.id
    })))
  })

  test('Cannot list team invitation without permissions', async ({ client, team }) => {
    const user = await UserFactory.create()
    const response = await client.get(`/teams/${team.id}/invites`).loginAs(user)

    response.assertForbidden()
  })

  test('Can list own invitations', async ({ client, assert, team, teamAdmin }) => {
    const user = await UserFactory.create()
    await InvitationFactory.merge({
      inviteeEmail: user.email,
      inviterId: teamAdmin.id,
      teamId: team.id,
    }).createMany(5)
    await InvitationFactory.merge({ // Create invitations not linked with user
      inviterId: teamAdmin.id,
      teamId: team.id,
    }).createMany(5)

    const response = await client.get('/invitations').loginAs(user)

    response.assertOk()
    assert.lengthOf(response.body().data, 5)
  })
})

