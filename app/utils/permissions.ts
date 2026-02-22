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

export type Mask<T> = number & { __brand: T }

const PermissionsGuard = <E extends Record<string, string | number>>(maskEnum: E) => ({
  can(obj: { permissions: Mask<E> }, ...flags: (keyof E)[]): boolean {
    return flags.every((flag) => {
      const bits = maskEnum[flag] as number
      return (obj.permissions & bits) === bits
    })
  },

  grant(obj: { permissions: Mask<E> }, ...flags: (keyof E)[]): Mask<E> {
    return flags.reduce(
      (acc, flag) => acc | (maskEnum[flag] as number),
      obj.permissions as number
    ) as Mask<E>
  },

  build(...flags: (keyof E)[]): Mask<E> {
    return flags.reduce((acc, flag) => acc | (maskEnum[flag] as number), 0) as Mask<E>
  },

  allPermissions(): Mask<E> {
    return 0x7fffffff as Mask<E> // U32 max in hexadecimal
  },
})

/*
  PERMISSIONS BEGIN HERE
*/
export enum UserPermissions {
  CREATE_EVENT = 1 << 0, // Whether user can create a new event
  MANAGE_ALL_EVENTS = 1 << 1, // Whether user can manage all events on platform (administrative)
  CREATE_TEAM = 1 << 2, // Whether user can create teams for events
  MANAGE_ALL_TEAMS = 1 << 3, // Whether user can manage all teams on platform (administrative)
  MANAGE_ALL_TASKS = 1 << 4, // Whether user can manage all tasks on platform
}
export const UserGuard = PermissionsGuard(UserPermissions)

export enum TeamMemberPermissions {
  MANAGE_MEMBERS = 1 << 0, // Whether member can invite, remove and change other member permissions
  REGISTER_AND_SUBMIT_TASK = 1 << 1, // Whether member can register team for tasks and submit them
  MANAGE_TEAM = 1 << 2, // Whether user can edit and/or delete team
}

export const TeamMemberGuard = PermissionsGuard(TeamMemberPermissions)

export enum EventAdminPermissions {
  MANAGE_EVENT = 1 << 0, // Whether user can rename event, change description, etc...
  CREATE_TASK = 1 << 1, // Whether user can create new tasks for an event
  MANAGE_ALL_TASKS = 1 << 2, // Whether user can remove, and edit all tasks
  VIEW_DRAFT = 1 << 3, // Whether user can see and edit event in draft state
  MANAGE_ADMINS = 1 << 4, // Whether user can assign/revoke other event administrators
  MANAGE_ORGANIZATIONS = 1 << 5, // Whether user can manage organizations for the event
  MANAGE_SPONSORS = 1 << 6, // Whether user can manage sponsors for the event
  MANAGE_JURY_MEMBERS = 1 << 7, // Whether user can manage jury members for the events tasks
}
export const EventAdminGuard = PermissionsGuard(EventAdminPermissions)
