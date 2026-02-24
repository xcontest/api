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