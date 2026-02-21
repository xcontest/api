//          ______            __            __
//    _  __/ ____/___  ____  / /____  _____/ /_
//   | |/_/ /   / __ \/ __ \/ __/ _ \/ ___/ __/
//  _>  </ /___/ /_/ / / / / /_/  __(__  ) /_
// /_/|_|\____/\____/_/ /_/\__/\___/____/\__/
//     Copyright (C) 2026 xContest Team

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see http://www.gnu.org/licenses/.

import User from '#models/user'
import { UserGuard } from '#utils/permissions'
import { loginValidator, registerValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
  public async redirect({ ally, params }: HttpContext) {
    return ally.use(params.provider).redirect()
  }

  public async callback({ ally, auth, params, response }: HttpContext) {
    const provider = ally.use(params.provider)

    // Handle common OAuth errors
    if (provider.accessDenied())
      return response.unauthorized('You cancelled the login process')
    if (provider.stateMisMatch())
      return response.badRequest('Request expired, please try again')
    if (provider.hasError())
      return response.badRequest(provider.getError())

    // Fetch user data from the provider
    const socialUser = await provider.user()

    // Find existing user or create a new one
    const user = await User.firstOrCreate(
      { email: socialUser.email },
      {
        email: socialUser.email,
        nickname: socialUser.nickName,
        // name and surname are kept as null and will be overriten later
        avatarUrl: socialUser.avatarUrl,
        password: null,
        permissions: UserGuard.build() // TODO: Combine into constant of BASE_PERMISSIONS or sth idk
      }
    )

    // Authenticate the session
    // 'web' is the default session guard in AdonisJS
    await auth.use('web').login(user)

    return response.redirect('/status')
  }

  public async register({ request, auth, response }: HttpContext) {
    // Validate the input (email, password, etc.)
    const payload = await request.validateUsing(registerValidator)

    // Create the user
    // The password will be hashed automatically by the User model hooks
    const user = await User.create({
        permissions: UserGuard.build(),
        ...payload
    })

    // Log them in immediately to the session
    await auth.use('web').login(user)

    return response.created({ message: 'Registration successful', user })
  }

  public async login({ request, auth, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.findBy('email', email)

    // If the user exists but has no password, 
    // they must use their social provider to log in.
    if (user && !user.password) {
        return response.badRequest('Please log in using your social provider.')
    }

    // Otherwise, proceed with normal verification
    const validatedUser = await User.verifyCredentials(email, password)
    await auth.use('web').login(validatedUser)
  }

  public async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/')
  }
}