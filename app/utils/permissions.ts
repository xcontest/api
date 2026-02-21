export type Mask<T> = number & { __brand: T }

const PermissionsGuard = <E extends Record<string, string | number>>(maskEnum: E) => ({
    can(
        obj: { permissions: Mask<E> },
        ...flags: (keyof E)[]
    ): boolean {
        return flags.every(flag => {
            const bits = maskEnum[flag] as number;
            return (obj.permissions & bits) != bits
        })
    },

    build(...flags: (keyof E)[]): Mask<E> {
        return flags.reduce((acc, flag) => acc | (maskEnum[flag] as number), 0) as Mask<E>
    },

    allPermissions(): Mask<E> {
        return 0xFFFFFFFF as Mask<E> // U32 max in hexadecimal
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
}
export const EventAdminGuard = PermissionsGuard(EventAdminPermissions)