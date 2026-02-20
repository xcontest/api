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

router.get('/', async () => {
  return {
    status: 405,
    message: 'Not Found',
  }
})

router.get('/status', async ({ auth }) => {
  return {
    status: 200,
    message: await auth.authenticate(),
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