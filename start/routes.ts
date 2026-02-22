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

/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import app from '@adonisjs/core/services/app'
import { UserGuard } from '#utils/permissions'

router.get('/', async () => {
  return {
    status: 200,
    message: 'API is running',
  }
})

router.get('/status', async ({ auth }) => {
  return {
    status: 200,
    message: await auth.authenticate(),
  }
})

// Temporary endpoint for development
if (app.inDev)
  router.get('/adminme', async ({ auth }) => {
    const user = await auth.authenticate();
    user.permissions = UserGuard.allPermissions()
    await user.save()
    return {
      status: 200,
      message: user,
    }
  })

const AuthController = () => import('#controllers/auth_controller')
router.group(() => {
  router.get('/:provider/redirect', [AuthController, 'redirect'])
  router.get('/:provider/callback', [AuthController, 'callback'])

  router.post('register', [AuthController, 'register'])
  router.post('login', [AuthController, 'login'])

  router.post('logout', [AuthController, 'logout']).use(middleware.auth())
}).prefix('auth')

const EventsController = () => import('#controllers/events_controller')
router.resource('events', EventsController)
  .apiOnly()
  .use(['store', 'update', 'destroy'], middleware.auth())

router.group(() => {
  router.get('/', [EventsController, 'indexAdministrators'])
  router.post('/', [EventsController, 'storeAdministrator'])
  router.put('/:adminId', [EventsController, 'updateAdministrator'])
  router.patch('/:adminId', [EventsController, 'updateAdministrator'])
  router.delete('/:adminId', [EventsController, 'destroyAdministrator'])
}).prefix('events/:id/administrators').use(middleware.auth())

const TeamsController = () => import('#controllers/teams_controller')
router
  .resource('teams', TeamsController)
  .only(['show', 'update', 'destroy'])
  .use(['update', 'destroy'], middleware.auth())
router.group(() => {
  router.post('/', [TeamsController, 'store'])
  router.get('/', [TeamsController, 'index'])
}).prefix('/events/:event_id/teams')

const OrganizationsController = () => import('#controllers/organizations_controller')
router.resource('events.organizations', OrganizationsController)
  .apiOnly()
  .use(['store', 'update', 'destroy'], middleware.auth())
