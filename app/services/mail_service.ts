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

import { emailsQueue } from '#start/mail'
import type TeamInvitation from '#models/team/team_invitation'
import env from '#start/env'

export class MailService {
  /**
   * Loads all required relations for the invitation, builds the full mail
   * payload, and enqueues it for the worker to send.
   */
  async queueInvite(invitation: TeamInvitation) {
    await invitation.load('inviter')
    await invitation.load('team')
    await invitation.team.load('event')

    const { inviter, team } = invitation
    const event = team.event
    const baseUrl = env.get('WEBSITE')

    await emailsQueue.add('invitation_email', {
      to: invitation.inviteeEmail,
      invitee: { name: invitation.inviteeEmail },
      inviter: { name: [inviter.name, inviter.surname].filter(Boolean).join(' ') || inviter.nickname },
      event: {
        title: event.title,
        date: event.createdAt?.toISODate() ?? '',
        description: event.description,
      },
      team: { name: team.name },
      inviteLink: `${baseUrl}/invitations/${invitation.id}?token=${invitation.token}`,
      unsubscribeLink: `${baseUrl}/unsubscribe`,
    })
  }
}