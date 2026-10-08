import * as availabilityRepo from '../repositories/availability.repository.js';
import { AppError } from '../utils/app-error.js';

export const listMine = (user) => availabilityRepo.listFutureSlots(user.id);

export const createSlot = (user, input) => availabilityRepo.insertSlot(user.id, input);

export async function deleteSlot(user, id) {
  const slot = await availabilityRepo.findSlotById(id);
  if (!slot) throw new AppError(404, 'NOT_FOUND', 'No encontramos lo que buscas');
  if (slot.organizerId !== user.id) throw new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta acción');
  await availabilityRepo.deleteSlot(id);
}
