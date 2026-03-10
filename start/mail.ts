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

import { Queue } from 'bullmq'
import app from '@adonisjs/core/services/app'
import mail from '@adonisjs/mail/services/main'
import redisConfig from '#config/redis'

/**
 * Shared BullMQ queue for outbound emails.
 * The `workers/mail.ts` worker picks jobs off this queue.
 */
export const emailsQueue = new Queue('emails', {
  connection: redisConfig.connections.main,
})

/**
 * Configure the mail messenger to push compiled messages onto the BullMQ
 * queue. Call `mail.sendLater()` anywhere in the app to enqueue a mail;
 */
mail.setMessenger((mailer) => ({
  async queue(mailMessage, config) {
    if (app.inTest)
      return

    await emailsQueue.add('send_email', {
      mailMessage,
      config,
      mailerName: mailer.name,
    })
  },
}))

app.terminating(async () => {
  await emailsQueue.close()
})
