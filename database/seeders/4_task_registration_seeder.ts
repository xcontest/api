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