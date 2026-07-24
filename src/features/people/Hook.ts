import { useCallback, useEffect, useMemo, useState } from 'react';
import { mhdPersonService } from './Service';
import type {
  MhdCreatePersonInput,
  MhdPeopleListFilters,
  MhdPerson,
  MhdPersonMutationContext,
  MhdUpdatePersonInput,
} from './Types';

export function useMhdPeople(initialFilters: MhdPeopleListFilters) {
  const [filters, setFilters] = useState<MhdPeopleListFilters>(initialFilters);
  const [people, setPeople] = useState<MhdPerson[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPeople = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const records = await mhdPersonService.listPeople(filters);
      setPeople(records);
      setSelectedPersonId((current) =>
        current && records.some((person) => person.id === current)
          ? current
          : (records[0]?.id ?? null),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load people.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: fetch-on-mount with loading state
    void loadPeople();
  }, [loadPeople]);

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedPersonId) ?? null,
    [people, selectedPersonId],
  );

  const createPerson = useCallback(
    async (input: MhdCreatePersonInput, context: MhdPersonMutationContext) => {
      const person = await mhdPersonService.createPerson(input, context);
      await loadPeople();
      setSelectedPersonId(person.id);
      return person;
    },
    [loadPeople],
  );

  const updatePerson = useCallback(
    async (input: MhdUpdatePersonInput, context: MhdPersonMutationContext) => {
      const person = await mhdPersonService.updatePerson(input, context);
      await loadPeople();
      setSelectedPersonId(person.id);
      return person;
    },
    [loadPeople],
  );

  return {
    filters,
    setFilters,
    people,
    selectedPerson,
    selectedPersonId,
    setSelectedPersonId,
    isLoading,
    errorMessage,
    refreshPeople: loadPeople,
    createPerson,
    updatePerson,
  };
}
