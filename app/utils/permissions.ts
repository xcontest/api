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

export type Mask<T> = number & { __brand: T }

const PermissionsGuard = <E extends Record<string, string | number>>(maskEnum: E) => ({
    can(
        obj: { permissions: Mask<E> },
        ...flags: (keyof E)[]
    ): boolean {
        return flags.every(flag => {
            const bits = maskEnum[flag] as number;
            return (obj.permissions & bits) == bits
        })
    },

    grant(
        obj: { permissions: Mask<E> },
        ...flags: (keyof E)[]
    ): Mask<E> {
        return flags.reduce((acc, flag) => acc | (maskEnum[flag] as number), obj.permissions as number) as Mask<E>
    },

    build(...flags: (keyof E)[]): Mask<E> {
        return flags.reduce((acc, flag) => acc | (maskEnum[flag] as number), 0) as Mask<E>
    },

    allPermissions(): Mask<E> {
        return 0x7FFFFFFF as Mask<E> // U32 max in hexadecimal
    }
})

/*
  PERMISSIONS BEGIN HERE
*/
export enum UserPermissions {
    CREATE_EVENT  = 0 << 0, // Whether user can create a new event
    MANAGE_ALL_EVENTS = 0 << 1, // Whether user can manage all events on platform
}
export const UserGuard = PermissionsGuard(UserPermissions)

export enum TeamMemberPermissions {
    MANAGE_MEMBERS           = 0 << 0, // Whether member can invite, remove and change other member permissions
    REGISTER_AND_SUBMIT_TASK = 0 << 1, // Whether member can register team for tasks and submit them
}
export const TeamMemberGuard = PermissionsGuard(TeamMemberPermissions)

export enum EventAdminPermissions {
    MANAGE_EVENT     = 0 << 0, // Whether user can rename event, change description, etc...
    CREATE_TASK      = 0 << 1, // Whether user can create new tasks for an event
    MANAGE_ALL_TASKS = 0 << 2, // Whether user can remove, and edit all tasks
    VIEW_DRAFT       = 0 << 3, // Whether user can see and edit event in draft state
}
export const EventAdminGuard = PermissionsGuard(EventAdminPermissions)