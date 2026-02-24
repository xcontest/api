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

import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Task from '#models/task/task'
import Team from '#models/team/team'
import TaskRegistration from '#models/task/task_registration'

export default class extends BaseSeeder {
  async run() {
    const visibleTask = await Task.findBy('slug', 'visible-task')
    if (!visibleTask) 
      throw new Error('Visible task not found. Please run TaskSeeder first.')
    

    const team = await Team.query().where('name', "User's team").first()
    if (!team) 
      throw new Error('Team not found. Please run TeamSeeder first.')
    

    await TaskRegistration.create({
      taskId: visibleTask.id,
      teamId: team.id,
    })
  }
}