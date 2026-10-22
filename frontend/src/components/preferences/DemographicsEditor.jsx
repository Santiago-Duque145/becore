import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { updateMe } from '../../services/profile.api.js';
import { Button, useToast } from '../ui/index.js';
import { DemographicsFields } from './DemographicsFields.jsx';

const toggle = (current, value) => (current === value ? null : value);

// "Sobre ti" en Perfil: edita sexo y rango de edad con PATCH /me. null borra el dato.
export function DemographicsEditor() {
  const { profile, setProfile } = useAuth();
  const toast = useToast();
  const [gender, setGender] = useState(profile?.gender ?? null);
  const [ageRange, setAgeRange] = useState(profile?.ageRange ?? null);

  const mutation = useMutation({
    mutationFn: async () => (await updateMe({ gender, ageRange })).data,
    onSuccess: (me) => {
      setProfile(me);
      toast.success('Guardamos tus datos.');
    },
    onError: (err) => toast.error(err.message),
  });

  const unchanged = gender === (profile?.gender ?? null) && ageRange === (profile?.ageRange ?? null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      noValidate
    >
      <DemographicsFields
        gender={gender}
        ageRange={ageRange}
        onGender={(value) => setGender((current) => toggle(current, value))}
        onAgeRange={(value) => setAgeRange((current) => toggle(current, value))}
      />
      <Button type="submit" disabled={unchanged} loading={mutation.isPending} className="w-full md:w-auto md:self-start">
        Guardar
      </Button>
    </form>
  );
}
