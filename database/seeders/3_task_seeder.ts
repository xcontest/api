import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Task from '#models/task/task'
import Event from '#models/event/event'
import HackathonTask from '#models/hackathon/hackathon_task'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const hackathonEvent = await Event.findBy('slug', 'hackathon-tasks')
    if (!hackathonEvent) 
      throw new Error('Hackathon event not found. Please run EventSeeder first.')
    

    const tasks = await Task.createMany([
      {
        eventId: hackathonEvent.id,
        slug: 'hidden-task',
        title: 'Hidden Hackathon Task',
        description: 'This task is not yet visible to participants.',
        taskType: 'HACKATHON',
        status: 'DRAFT',
        detailsRevealAt: null,
        registrationStartAt: null,
        registrationEndAt: null,
      },
      {
        eventId: hackathonEvent.id,
        slug: 'visible-task',
        title: 'Visible Hackathon Task',
        description: 'This task is open for registration.',
        taskType: 'HACKATHON',
        status: 'ACTIVE',
        detailsRevealAt: DateTime.now().plus({ days: 1 }), // Details will be revealed in 1 day
        registrationStartAt: DateTime.now(),
        registrationEndAt: DateTime.now().plus({ days: 7 }), // 1 week from now
      },
      {
        eventId: hackathonEvent.id,
        slug: 'visible-task-2',
        title: 'Visible Hackathon Task 2',
        description: 'This task is open for registration and details are already revealed.',
        taskType: 'HACKATHON',
        status: 'ACTIVE',
        detailsRevealAt: DateTime.now().minus({ days: 1 }), // Details were revealed 1 day ago
        registrationStartAt: DateTime.now(),
        registrationEndAt: DateTime.now().plus({ days: 7 }), // 1 week from now
      }
    ])

    for (const task of tasks) 
      await HackathonTask.create({
        taskId: task.id,
        requirementsDocumentUrl: `http://localhost/requirements/${task.slug}`,
      })
  }
}