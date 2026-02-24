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

test.group('Auth login', (group) => {
  group.each.setup(() => testUtils.db().seed())
  group.each.teardown(() => testUtils.db().truncate())

  test('logs in successfully with correct credentials', async ({ client, assert }) => {
    const response = await client.post('/auth/login').json({
      email: 'user@local.host',
      password: 'userpassword',
    })

    response.assertStatus(200)
    assert.equal(response.body().message, 'Login successful')
    assert.exists(response.body().user)
    assert.exists(response.cookie('xcontest-session'))
  })

  test('fails with incorrect password', async ({ client }) => {
    const response = await client.post('/auth/login').json({
      email: 'user@local.host',
      password: 'wrongpassword',
    })

    response.assertStatus(400)
  })

  test('fails with non-existent email', async ({ client }) => {
    const response = await client.post('/auth/login').json({
      email: 'user@no.host',
      password: 'testtesttest'
    })

    response.assertStatus(400)
  })

  test('fails when required fields are missing', async ({ client }) => {
    const response = await client.post('/auth/login').json({
      email: ''
    })
    response.assertStatus(422)
  })

})
