import { searchParticipants } from '../repositories/profiles.repository.js';

const MAX_RESULTS = 20;

export const findParticipants = (q) => searchParticipants(q, MAX_RESULTS);
