import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/events.repository.js', () => ({
  insertEvent: vi.fn(),
  findEventById: vi.fn(),
  updateEvent: vi.fn(),
  listEvents: vi.fn(),
}));
vi.mock('../src/repositories/attendance.repository.js', () => ({
  findUserAttendances: vi.fn(),
  listConfirmedPreviewIds: vi.fn(),
  listConfirmedUserIds: vi.fn().mockResolvedValue([]),
}));
vi.mock('../src/repositories/profiles.repository.js', () => ({ findAvatarsByIds: vi.fn() }));
vi.mock('../src/services/notifications.service.js', () => ({ notify: vi.fn() }));
vi.mock('../src/services/rating-requests.service.js', () => ({ requestRatingsForEvent: vi.fn() }));

import * as repo from '../src/repositories/events.repository.js';
import { locatePlace } from '../src/services/geocode.service.js';
import * as service from '../src/services/events.service.js';

// Todo evento debe quedar en el mapa: sin pin se geocodifica el texto del lugar (corrección tras P6)
const owner = { id: 'owner-1', role: 'organizer' };
const base = {
  title: 'Estreno',
  category: 'culture',
  location: 'Sala 4 IMAX Centro Comercial Viva Envigado',
  startsAt: '2030-01-01T20:00:00Z',
  capacity: 10,
};
const hit = { lat: 6.1762915, lng: -75.5916923, label: 'Viva Envigado' };

beforeEach(() => {
  vi.clearAllMocks();
  repo.insertEvent.mockImplementation(async (_userId, row) => ({
    id: 'n1',
    organizerId: owner.id,
    status: 'draft',
    confirmedCount: 0,
    ...row,
  }));
  repo.updateEvent.mockImplementation(async (_id, patch) => ({
    id: 'e1',
    organizerId: owner.id,
    status: 'published',
    confirmedCount: 0,
    ...patch,
  }));
  locatePlace.mockReset();
});

describe('crear evento', () => {
  it('sin coordenadas geocodifica el texto del lugar y guarda lat/lng', async () => {
    locatePlace.mockResolvedValue(hit);
    await service.createEvent(owner, { ...base });
    expect(locatePlace).toHaveBeenCalledWith(base.location);
    expect(repo.insertEvent).toHaveBeenCalledWith(
      owner.id,
      expect.objectContaining({ latitude: 6.1762915, longitude: -75.5916923 }),
    );
  });

  it('con el pin del selector no geocodifica y respeta ese pin', async () => {
    await service.createEvent(owner, { ...base, latitude: 6.2, longitude: -75.5 });
    expect(locatePlace).not.toHaveBeenCalled();
    expect(repo.insertEvent).toHaveBeenCalledWith(owner.id, expect.objectContaining({ latitude: 6.2, longitude: -75.5 }));
  });

  it('con null explícito (sin ubicación a propósito) no geocodifica', async () => {
    await service.createEvent(owner, { ...base, latitude: null, longitude: null });
    expect(locatePlace).not.toHaveBeenCalled();
  });

  it('si no se puede ubicar el lugar, el evento se guarda igual y sin coordenadas', async () => {
    locatePlace.mockResolvedValue(null);
    await expect(service.createEvent(owner, { ...base })).resolves.toBeTruthy();
    expect(repo.insertEvent.mock.calls[0][1]).not.toHaveProperty('latitude');
  });

  it('una portada ajena falla con 403 antes de salir a la red', async () => {
    await expect(service.createEvent(owner, { ...base, coverPath: 'otro/portada.webp' })).rejects.toMatchObject({ status: 403 });
    expect(locatePlace).not.toHaveBeenCalled();
    expect(repo.insertEvent).not.toHaveBeenCalled();
  });
});

describe('editar evento', () => {
  const unlocated = {
    id: 'e1',
    organizerId: owner.id,
    status: 'published',
    startsAt: '2099-01-01T00:00:00Z',
    capacity: 10,
    confirmedCount: 0,
    location: 'Parque Sabaneta',
    latitude: null,
    longitude: null,
  };

  it('un evento sin ubicación (y sin pin nuevo) se ubica con el texto del lugar', async () => {
    repo.findEventById.mockResolvedValue(unlocated);
    locatePlace.mockResolvedValue({ lat: 6.15, lng: -75.61 });
    await service.updateEvent(owner, 'e1', { capacity: 12 });
    expect(locatePlace).toHaveBeenCalledWith('Parque Sabaneta');
    expect(repo.updateEvent).toHaveBeenCalledWith('e1', expect.objectContaining({ capacity: 12, latitude: 6.15, longitude: -75.61 }));
  });

  it('si cambia el lugar, ubica el texto nuevo', async () => {
    repo.findEventById.mockResolvedValue(unlocated);
    locatePlace.mockResolvedValue({ lat: 6.15, lng: -75.61 });
    await service.updateEvent(owner, 'e1', { location: 'Parque Envigado' });
    expect(locatePlace).toHaveBeenCalledWith('Parque Envigado');
  });

  it('un evento que ya tiene ubicación no se toca', async () => {
    repo.findEventById.mockResolvedValue({ ...unlocated, latitude: 6.2, longitude: -75.5 });
    await service.updateEvent(owner, 'e1', { location: 'Otro nombre del mismo sitio' });
    expect(locatePlace).not.toHaveBeenCalled();
    expect(repo.updateEvent.mock.calls[0][1]).not.toHaveProperty('latitude');
  });

  it('quitar el pin a propósito (null, null) se respeta y no se vuelve a geocodificar', async () => {
    repo.findEventById.mockResolvedValue({ ...unlocated, latitude: 6.2, longitude: -75.5 });
    await service.updateEvent(owner, 'e1', { latitude: null, longitude: null });
    expect(locatePlace).not.toHaveBeenCalled();
    expect(repo.updateEvent).toHaveBeenCalledWith('e1', expect.objectContaining({ latitude: null, longitude: null }));
  });

  it('un pin nuevo del selector manda sobre la geocodificación', async () => {
    repo.findEventById.mockResolvedValue(unlocated);
    await service.updateEvent(owner, 'e1', { latitude: 6.3, longitude: -75.4 });
    expect(locatePlace).not.toHaveBeenCalled();
    expect(repo.updateEvent).toHaveBeenCalledWith('e1', expect.objectContaining({ latitude: 6.3, longitude: -75.4 }));
  });
});
