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

import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Auth register', (group) => {
  group.each.setup(() => testUtils.db().seed())
  group.each.teardown(() => testUtils.db().truncate())

  test('registers a new user successfully', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      nickname: 'newuser',
      email: 'newuser@local.host',
      password: 'password123',
      password_confirmation: 'password123',
    })

    response.assertStatus(201)
    assert.equal(response.body().message, 'Registration successful')
    assert.exists(response.body().user.id)
    assert.equal(response.body().user.email, 'newuser@local.host')
  })

  test('fails when password is not strong enough', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      nickname: 'mysecondaccount',
      email: 'newuser@local.host',
      password: 'notsafe',
      password_confirmation: 'notsafe',
    })

    response.assertStatus(422)
  })

  test('fails when email is already taken', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      nickname: 'mysecondaccount',
      email: 'user@local.host',
      password: 'safe123123123',
      password_confirmation: 'safe123123123',
    })

    response.assertStatus(422)
  })

  test('fails when required fields are missing', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      email: '',
    })

    response.assertStatus(422)
  })

  test('fails when passwords do not match', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      nickname: 'n32user',
      email: 'newuser@local.host',
      password: 'password123',
      password_confirmation: 'password456',
    })

    response.assertStatus(422)
  })
})
