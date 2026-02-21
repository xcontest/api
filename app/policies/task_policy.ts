import User from '#models/user'
import Task from '#models/task/task'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { UserGuard } from '#utils/permissions'

export default class TaskPolicy extends BasePolicy {
}