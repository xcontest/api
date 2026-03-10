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

import User from '#models/user'
import { UserGuard } from '#utils/permissions'
import {
  forgotPasswordValidator,
  loginValidator,
  providerParamValidator,
  registerValidator,
  resetPasswordValidator,
} from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import {
  ApiOperation,
  ApiRequest,
  ApiResponse,
} from '#openapi/decorators'
import { generateSecureToken } from '#utils/teams'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

export default class AuthController {
  @ApiOperation({ description: 'Redirects to the social provider for authentication' })
  @ApiRequest({ validator: providerParamValidator, withResponse: true })
  @ApiResponse(307, { description: 'Redirects to the social provider' })
  public async redirect({ ally, request }: HttpContext) {
    const { params } = await request.validateUsing(providerParamValidator)
    return ally.use(params.provider).redirect()
  }

  @ApiOperation({ description: 'Handles the callback from the social provider' })
  @ApiRequest({ validator: providerParamValidator, withResponse: true })
  @ApiResponse(307, { description: 'Redirects to the status page' })
  public async callback({ ally, auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(providerParamValidator)
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
        nickname: socialUser.nickName || socialUser.name || socialUser.email.split('@')[0],
        // name and surname are kept as null and will be overridden later
        avatarUrl: socialUser.avatarUrl,
        password: null,
        permissions: UserGuard.build(), // TODO: Combine into constant of BASE_PERMISSIONS or sth idk
      },
    )

    // Authenticate the session
    // 'web' is the default session guard in AdonisJS
    await auth.use('web').login(user)

    return response.redirect('/status')
  }

  @ApiOperation({ description: 'Registers a new user with email and password' })
  @ApiRequest({ validator: registerValidator, withResponse: true })
  @ApiResponse(201, { description: 'User registered successfully', data: User })
  public async register({ request, auth, response }: HttpContext) {
    // Validate the input (email, password, etc.)
    const payload = await request.validateUsing(registerValidator)

    // Create the user
    // The password will be hashed automatically by the User model hooks
    const user = await User.create({
      permissions: UserGuard.build(),
      ...payload,
    })

    // Log them in immediately to the session
    await auth.use('web').login(user)

    return response.created({ message: 'Registration successful', user })
  }

  @ApiOperation({ description: 'Logs in a user with email and password' })
  @ApiRequest({ validator: loginValidator, withResponse: true })
  @ApiResponse(200, { description: 'User logged in successfully', data: User })
  public async login({ request, auth, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.findBy('email', email)

    // If the user exists but has no password,
    // they must use their social provider to log in.
    if (user && !user.password)
      return response.badRequest('Please log in using your social provider.')

    // Otherwise, proceed with normal verification
    const validatedUser = await User.verifyCredentials(email, password)
    await auth.use('web').login(validatedUser)

    return response.ok({ message: 'Login successful', user: validatedUser })
  }

  @ApiOperation({ description: 'Logs out the current user' })
  @ApiResponse(200, { description: 'User logged out successfully' })
  public async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/')
  }

  @ApiOperation({ description: 'Send password reset request for a user' })
  @ApiRequest({ validator: forgotPasswordValidator, withResponse: true })
  @ApiResponse(200, { description: 'Password reset email sent' })
  @ApiResponse(404, { description: 'User not found or uses social login' })
  public async forgotPassword({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    const user = await User.findBy('email', email)

    if (!user)
      return response.notFound({ message: 'User not found' })

    user.passwordResetToken = generateSecureToken()
    user.passwordResetExpires = DateTime.now().plus({ minutes: 15 })
    await user.save()

    await mail.sendLater((message) => {
      message
        .to(user.email)
        .subject('Password Reset Request')
        .htmlView('user/password_reset', {
          user: { name: user.nickname },
          resetLink: `${env.get('WEBSITE')}reset-password?token=${user.passwordResetToken}`,
          linkExpiryTime: user.passwordResetExpires!.toLocal().toLocaleString(DateTime.DATETIME_MED),
        })
    })

    return response.ok({ message: 'Password reset email sent' })
  }

  @ApiOperation({ description: 'Resets user password using a reset token' })
  @ApiRequest({ validator: resetPasswordValidator, withResponse: true })
  @ApiResponse(200, { description: 'Password reset successful' })
  @ApiResponse(400, { description: 'Invalid or expired token' })
  public async resetPassword({ request, response }: HttpContext) {
    const { qs, newPassword } = await request.validateUsing(resetPasswordValidator, {
      data: {
        ...request.body(),
        qs: request.qs(),
      },
    })

    const user = await User.findBy('passwordResetToken', qs.token)
    if (!user || user.passwordResetExpires!.diffNow().as('milliseconds') < 0)
      return response.badRequest({ message: 'Invalid or expired token' })

    user.password = newPassword
    user.passwordResetToken = null
    user.passwordResetExpires = null
    await user.save()

    return response.ok({ message: 'Password reset successful! You can now login.' })
  }
}
