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

import { Worker } from 'bullmq'
import mail from '@adonisjs/mail/services/main'
import app from '@adonisjs/core/services/app'
import redisConfig from '#config/redis'
import logger from '@adonisjs/core/services/logger'

/**
 * BullMQ worker that processes outbound email jobs enqueued by the mail
 * messenger configured in `start/mail.ts`.
 */
const worker = new Worker(
  'emails',
  async (job) => {
    if (job.name === 'send_email') {
      const { mailMessage, config, mailerName } = job.data
      try {
        await mail.use(mailerName).sendCompiled(mailMessage, config)
      } catch (error) {
        logger.error(error)
      }
    }
  },
  { connection: redisConfig.connections.main },
)

app.terminating(async () => {
  await worker.close()
})
