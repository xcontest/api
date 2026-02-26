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

import { TeamFactory } from '#database/factories/team_factory'
import Task from '#models/task/task'
import Event from '#models/event/event'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import User from '#models/user'
import Team from '#models/team/team'
import TaskRegistration from '#models/task/task_registration'

test.group('Registrations', (group) => {
  group.each.setup(() => testUtils.db().seed())
  group.each.teardown(() => testUtils.db().truncate())

  test('Registers a team to a task successfully', async ({ client }) => {
    const event = await Event.findByUuidOrSlug('hackathon-tasks')
    const user = await User.findByOrFail('nickname', 'user')
    const team = await Team.findByOrFail('name', 'User\'s team')
      
    const task = await Task.query().where('event_id', event.id).firstOrFail()
    const response = await client.post(`/tasks/${task.slug}/registrations`).json({
      teamId: team.id,
    }).loginAs(user)

    response.assertCreated()
    response.assertBodyContains({
      teamId: team.id,
      taskId: task.id,
    })
  })

  test('Unregisters a team from a task successfully', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const team = await Team.findByOrFail('name', 'User\'s team')
    const registration = await TaskRegistration.query().where('team_id', team.id).firstOrFail()
      
    const response = await client.delete(`/registrations/${registration.id}`).loginAs(user)

    response.assertNoContent()
  })

  test('Fails when user is not a member of the team', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const event = await Event.findByUuidOrSlug('hackathon-tasks')

    const team = await TeamFactory.with('members', 1, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .create()

    const task = await Task.query().where('event_id', event.id).firstOrFail()
    const response = await client.post(`/tasks/${task.slug}/registrations`).json({
      teamId: team.id,
    }).loginAs(user)

    response.assertForbidden()
  })

  test('Fails when team is from a different event', async ({ client }) => {
    const event = await Event.findByUuidOrSlug('no-tasks')
    const team = await TeamFactory.with('members', 1, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .create()

    await team.load('members')
    const member = team.members[0]
    await member.load('user')

    const taskEvent = await Event.findByUuidOrSlug('hackathon-tasks')
    const task = await Task.query().where('event_id', taskEvent.id).firstOrFail()
    const response = await client.post(`/tasks/${task.slug}/registrations`).json({
      teamId: team.id,
    }).loginAs(member.user)

    response.assertForbidden()
  })

  test('Fails when registration has not started yet', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const team = await Team.findByOrFail('name', 'User\'s team')

    const task = await Task.findByOrFail('slug', 'registration-not-started')
    const response = await client.post(`/tasks/${task.slug}/registrations`).json({
      teamId: team.id,
    }).loginAs(user)

    response.assertBadRequest()
  })

  test('Fails when registration has already ended', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const team = await Team.findByOrFail('name', 'User\'s team')
    
    const task = await Task.findByOrFail('slug', 'registration-closed')
    const response = await client.post(`/tasks/${task.slug}/registrations`).json({
      teamId: team.id,
    }).loginAs(user)
    
    response.assertBadRequest()
  })

  test('Fails when team size is below the minimum', async ({ client }) => {
    const event = await Event.findByUuidOrSlug('team-size-event')

    const team = await TeamFactory.with('members', 1, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .create()

    await team.load('members')
    const member = team.members[0]
    await member.load('user')
      
    const task = await Task.query().where('event_id', event.id).firstOrFail()
    const response = await client.post(`/tasks/${task.slug}/registrations`).json({
      teamId: team.id,
    }).loginAs(member.user)

    response.assertBadRequest()
  })

  test('Fails when team size is above the maximum', async ({ client }) => {
    const event = await Event.findByUuidOrSlug('team-size-event')

    const team = await TeamFactory.with('members', 5, (member) => member.with('user'))
      .merge({ eventId: event.id })
      .create()

    await team.load('members', (query) => query.orderBy('created_at', 'asc'))
    const member = team.members[0]
    await member.load('user')
      
    const task = await Task.query().where('event_id', event.id).firstOrFail()
    const response = await client.post(`/tasks/${task.slug}/registrations`).json({
      teamId: team.id,
    }).loginAs(member.user)

    response.assertBadRequest()
  })

  test('Fails when task has autoregister enabled', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const team = await Team.findByOrFail('name', 'User\'s team')

    const task = await Task.findByOrFail('slug', 'autoregister-task')
    const response = await client.post(`/tasks/${task.slug}/registrations`).json({
      teamId: team.id,
    }).loginAs(user)
    
    response.assertBadRequest()
  })

  test('Fails when team is already registered', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const team = await Team.findByOrFail('name', 'User\'s team')
    
    const task = await Task.findByUuidOrSlug('visible-task')
    const response = await client.post(`/tasks/${task.slug}/registrations`).json({
      teamId: team.id,
    }).loginAs(user)
    
    response.assertConflict()
  })

  test('Fails to register when does not have permission', async ({ client }) => {
    const user2 = await User.findByOrFail('nickname', 'user2')
    const team = await Team.findByOrFail('name', 'User\'s team')
    const task = await Task.query().where('event_id', team.eventId).firstOrFail()

    const response = await client.post(`/tasks/${task.slug}/registrations`).json({
      teamId: team.id,
    }).loginAs(user2)
    
    response.assertForbidden()
  })

  test('Fails when is not authenticated', async ({ client }) => {
    const team = await Team.findByOrFail('name', 'User\'s team')
    const task = await Task.query().where('event_id', team.eventId).firstOrFail()

    const response = await client.post(`/tasks/${task.slug}/registrations`).json({
      teamId: team.id,
    })
    
    response.assertUnauthorized()
  })

  test('Fails to unregister when does not have permission', async ({ client }) => {
    const user2 = await User.findByOrFail('nickname', 'user2')
    const team = await Team.findByOrFail('name', 'User\'s team')
    const registration = await TaskRegistration.query().where('team_id', team.id).firstOrFail()

    const response = await client.delete(`/registrations/${registration.id}`).loginAs(user2)
    
    response.assertForbidden()
  })

  test('Fails to unregister when is not a member of the team', async ({ client }) => {
    const team = await Team.findByOrFail('name', 'User\'s team')
    const registration = await TaskRegistration.query().where('team_id', team.id).firstOrFail()
    
    const team2 = await TeamFactory.with('members', 1, (member) => member.with('user'))
      .merge({ eventId: team.eventId })
      .create()
      
    await team2.load('members')
    const member = team2.members[0]
    await member.load('user')
    
    const response = await client.delete(`/registrations/${registration.id}`).loginAs(member.user)
    response.assertForbidden()
  })

  test('Fails to unregister if the registration does not exist', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    
    const response = await client.delete('/registrations/00000000-0000-0000-0000-000000000000').loginAs(user)
    response.assertNotFound()
  })

  test('Fails to unregister when is not authenticated', async ({ client }) => {
    const team = await Team.findByOrFail('name', 'User\'s team')
    const registration = await TaskRegistration.query().where('team_id', team.id).firstOrFail()
      
    const response = await client.delete(`/registrations/${registration.id}`)

    response.assertUnauthorized()
  })
})