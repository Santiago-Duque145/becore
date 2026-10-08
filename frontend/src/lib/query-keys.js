export const queryKeys = {
  me: ['me'],
  eventsRoot: ['events'],
  events: (filters) => ['events', 'list', filters],
  event: (id) => ['events', 'detail', id],
  eventAttendees: (id) => ['events', 'detail', id, 'attendees'],
  eventActivity: (id) => ['events', 'detail', id, 'activity'],
  appointments: (scope) => ['appointments', scope],
  availability: ['availability'],
  dashboard: (role) => ['dashboard', role],
};
