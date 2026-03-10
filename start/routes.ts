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
import { generateApiSpec } from '#openapi/index'


router.get('/', async () => ({
  status: 200,
  message: 'API is running',
}))

router.get('/status', async ({ auth }) => ({
  status: 200,
  message: await auth.authenticate(),
}))

router.group(() => {
  router.get('/openapi.json', async ({ response }) => {
    if (app.inProduction)
      response.download('docs/spec/openapi.json')
    else
      // eslint-disable-next-line @unicorn/no-await-expression-member
      response.send((await generateApiSpec({ silent: true })).getSpecAsJson())
  })
  router.get('/', async ({ response }) => response.download('docs/spec/spec.html'))
}).prefix('/spec')

// Temporary endpoint for development
if (app.inDev)
  router.get('/adminme', async ({ auth }) => {
    const user = await auth.authenticate()
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

  router.post('forgot-password', [AuthController, 'forgotPassword'])
  router.post('reset-password', [AuthController, 'resetPassword'])
}).prefix('auth')

const EventsController = () => import('#controllers/events_controller')
router.resource('events', EventsController)
  .apiOnly()
  .use(['store', 'update', 'destroy'], middleware.auth())

router.group(() => {
  router.get('/', [EventsController, 'indexAdministrators'])
  router.post('/', [EventsController, 'storeAdministrator'])
  router.put('/:adminId', [EventsController, 'updateAdministrator']).as('events.update_administrator_put')
  router.patch('/:adminId', [EventsController, 'updateAdministrator']).as('events.update_administrator_patch')
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
router.group(() => {
  router.post('/invites', [TeamsController, 'storeInvite'])
  router.get('/invites', [TeamsController, 'indexInvites'])
  router.post('/kick', [TeamsController, 'kickMember'])
}).prefix('/teams/:id').use(middleware.auth())
router.group(() => {
  router.get('/:id', [TeamsController, 'respondToInvite'])
  router.get('/', [TeamsController, 'indexUserInvites'])
}).prefix('/invitations').use(middleware.auth())

const OrganizationsController = () => import('#controllers/organizations_controller')
router.resource('events.organizations', OrganizationsController)
  .apiOnly()
  .use(['store', 'update', 'destroy'], middleware.auth())

router.group(() => {
  router.get('/', [OrganizationsController, 'indexSponsors'])
  router.post('/', [OrganizationsController, 'storeSponsor'])
  router.get('/:sponsorId', [OrganizationsController, 'showSponsor'])
  router.delete('/:sponsorId', [OrganizationsController, 'destroySponsor'])
}).prefix('tasks/:id/sponsors').use(middleware.auth())

const TasksController = () => import('#controllers/tasks_controller')
router.resource('tasks', TasksController)
  .apiOnly()
  .except(['index', 'store'])
  .use(['update', 'destroy'], middleware.auth())

router.group(() => {
  router.post('/', [TasksController, 'storeTaskRegistration'])
}).prefix('tasks/:taskId/registrations').use(middleware.auth())

router.group(() => {
  router.delete('/:id', [TasksController, 'destroyTaskRegistration'])
}).prefix('registrations').use(middleware.auth())

const HackathonController = () => import('#controllers/hackathons_controller')
router.group(() => {
  router.put('/:id', [HackathonController, 'updateTask']).as('hackathon.update_task_put')
  router.patch('/:id', [HackathonController, 'updateTask']).as('hackathon.update_task_patch')
}).prefix('hackathon/tasks').use(middleware.auth())

router.group(() => {
  router.post('/', [HackathonController, 'storeHackathonSubmission'])
  router.get('/user', [HackathonController, 'indexHackathonSubmissionsByUser'])
  router.get('/team/:teamId', [HackathonController, 'indexHackathonSubmissionsByTeam'])
  router.get('/task/:taskId', [HackathonController, 'indexHackathonSubmissionsByTask'])
  router.get('/:id', [HackathonController, 'showHackathonSubmission'])
  router.put('/:id', [HackathonController, 'updateHackathonSubmission']).as('hackathon.update_submission_put')
  router.patch('/:id', [HackathonController, 'updateHackathonSubmission']).as('hackathon.update_submission_patch')
  router.delete('/:id', [HackathonController, 'destroyHackathonSubmission'])
}).prefix('hackathon/submissions').use(middleware.auth())

router.group(() => {
  router.get('/', [HackathonController, 'indexJuryMembers'])
  router.post('/', [HackathonController, 'storeJuryMember'])
  router.get('/:juryMemberId', [HackathonController, 'showJuryMember'])
  router.put('/:juryMemberId', [HackathonController, 'updateJuryMember']).as('hackathon.update_jury_member_put')
  router.patch('/:juryMemberId', [HackathonController, 'updateJuryMember']).as('hackathon.update_jury_member_patch')
  router.delete('/:juryMemberId', [HackathonController, 'destroyJuryMember'])
}).prefix('hackathon/tasks/:id/jury').use(middleware.auth())

router.group(() => {
  router.get('/tasks', [TasksController, 'index']).use(middleware.silentAuth())
  router.post('/task', [TasksController, 'store']).use(middleware.auth())
}).prefix('event/:event_id')

const ScoresController = () => import('#controllers/scores_controller')
router.group(() => {
  router.get('/', [ScoresController, 'indexCriteria'])
  router.post('/', [ScoresController, 'storeCriteria'])
  router.get('/:id', [ScoresController, 'showCriteria'])
  router.put('/:id', [ScoresController, 'updateCriteria']).as('scores.update_criteria_put')
  router.patch('/:id', [ScoresController, 'updateCriteria']).as('scores.update_criteria_patch')
  router.delete('/:id', [ScoresController, 'destroyCriteria'])
}).prefix('tasks/:task_id/scores').use(middleware.auth())
