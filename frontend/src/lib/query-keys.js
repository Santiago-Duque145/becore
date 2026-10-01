export const queryKeys = {
  me: ['me'],
  events: (filters) => ['events', filters],
  event: (id) => ['events', id],
  eventAttendees: (id) => ['events', id, 'attendees'],
  eventActivity: (id) => ['events', id, 'activity'],
  appointments: (scope) => ['appointments', scope],
  availability: ['availability'],
  dashboard: (role) => ['dashboard', role],
};
