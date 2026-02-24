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
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import { TeamFactory } from '#database/factories/team_factory'
import Event from '#models/event/event'

test.group('Teams core functionality', (group) => {
  group.each.setup(() => testUtils.db().seed())
  group.each.teardown(() => testUtils.db().truncate())

  test('Creates a new team successfully', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.post('/events/hackathon-tasks/teams').json({
      name: 'My Team',
    }).loginAs(admin)

    response.assertCreated()
    response.assertBodyContains({
      name: 'My Team',
    })
  })

  test('Fails to create a team without permissions', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')

    const response = await client.post('/events/not-visible/teams').json({
      name: 'My Team',
    }).loginAs(user)

    response.assertForbidden()
  })

  test('Updates team with new name', async ({ client }) => {
    const team = await TeamFactory.with('members', 1, (member) => member.with('user')).create()

    const response = await client.put(`/teams/${team.id}`).json({
      name: 'Updated Team Name',
    }).loginAs(team.members[0].user)

    response.assertOk()
    response.assertBodyContains({
      name: 'Updated Team Name',
    })
  })

  test('Cannot update team with missing permissions', async ({ client }) => {
    // Only the first user from the factory has administrative permissions
    const team = await TeamFactory.with('members', 2, (member) => member.with('user')).create()

    const response = await client.put(`/teams/${team.id}`).json({
      name: 'Updated Team Name',
    }).loginAs(team.members[1].user)

    response.assertForbidden()
  })

  test('Deletes a team successfully', async ({ client }) => {
    const team = await TeamFactory.with('members', 1, (member) => member.with('user')).create()

    const response = await client.delete(`/teams/${team.id}`).json({
      confirmation: team.name,
    }).loginAs(team.members[0].user)

    response.assertNoContent()
  })

  test('Fails to delete a team with invalid confirmation', async ({ client }) => {
    const team = await TeamFactory.with('members', 1, (member) => member.with('user')).create()

    const response = await client.delete(`/teams/${team.id}`).json({
      confirmation: 'Wrong Name',
    }).loginAs(team.members[0].user)

    response.assertUnprocessableEntity()
  })

  test('Lists all teams for an event', async ({ client }) => {
    const event = await Event.findByOrFail('slug', 'no-tasks')
    const teams = await TeamFactory.with('members', 1, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .createMany(5)

    const response = await client.get(`/events/${event.id}/teams`)

    response.assertOk()
    response.assertBodyContains({
      data: teams.map((team) => ({ id: team.id })),
    })
  })

  test('Cannot list teams for draft event', async ({ client }) => {
    const event = await Event.findByOrFail('slug', 'not-visible')

    const response = await client.get(`/events/${event.id}/teams`)
    response.assertForbidden()
  })

  test('Cannot create teams with duplicate names in one event', async ({ client }) => {
    const event = await Event.findByOrFail('slug', 'no-tasks')
    const team = await TeamFactory.with('members', 1, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .create()

    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.post('/events/no-tasks/teams').json({
      name: team.name,
    }).loginAs(admin)

    response.assertUnprocessableEntity()
  })

  test('Can create teams with duplicate names in different events', async ({ client }) => {
    const event = await Event.findByOrFail('slug', 'no-tasks')
    const team = await TeamFactory.with('members', 1, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .create()

    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.post('/events/hackathon-tasks/teams').json({
      name: team.name,
    }).loginAs(admin)

    response.assertCreated()
  })

  test('Cannot update team to have name colliding with other team', async ({ client }) => {
    const event = await Event.findByOrFail('slug', 'no-tasks')
    const teams = await TeamFactory.with('members', 1, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .createMany(2)

    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.put(`/teams/${teams[1].name}`).json({
      name: teams[0].name,
    }).loginAs(admin)

    response.assertUnprocessableEntity()
  })

  test('User can leave team', async ({ client }) => {
    const event = await Event.findByOrFail('slug', 'no-tasks')
    const team = await TeamFactory.with('members', 2, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .create()

    // Kicking self = leaving
    const response = await client.post(`/teams/${team.id}/kick`).json({
      member: team.members[1].id,
    }).loginAs(team.members[1].user)

    response.assertNoContent()
  })

  test('Team admin can kick people out of team', async ({ client }) => {
    const event = await Event.findByOrFail('slug', 'no-tasks')
    const team = await TeamFactory.with('members', 2, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .create()

    const response = await client.post(`/teams/${team.id}/kick`).json({
      member: team.members[1].id,
    }).loginAs(team.members[0].user)

    response.assertNoContent()
  })

  test('Unauthorized user cannot kick other people out of team', async ({ client }) => {
    const event = await Event.findByOrFail('slug', 'no-tasks')
    const team = await TeamFactory.with('members', 3, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .create()

    const response = await client.post(`/teams/${team.id}/kick`).json({
      member: team.members[1].id,
    }).loginAs(team.members[2].user)

    response.assertForbidden()
  })

  test('Owner cannot leave the team or be kicked', async ({ client }) => {
    const event = await Event.findByOrFail('slug', 'no-tasks')
    const team = await TeamFactory.with('members', 2, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .create()

    const response = await client.post(`/teams/${team.id}/kick`).json({
      member: team.members[0].id,
    }).loginAs(team.members[0].user)

    response.assertForbidden()
  })
})
