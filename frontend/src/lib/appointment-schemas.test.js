import { describe, it, expect } from 'vitest';
import { appointmentFormSchema } from './appointment-schemas.js';

describe('appointmentFormSchema', () => {
  it('no revienta con fechas vacías', () => {
    const result = appointmentFormSchema.safeParse({ title: 'Reunión', notes: '', location: '', startsAt: '', endsAt: '' });
    expect(result.success).toBe(false);
    expect(result.error.issues.map((i) => i.path[0])).toEqual(expect.arrayContaining(['startsAt', 'endsAt']));
  });
});
