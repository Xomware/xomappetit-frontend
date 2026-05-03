'use client';
import Modal from './Modal';
import MealForm, { MealFormValues } from './MealForm';
import { Meal } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (meal: Omit<Meal, 'id' | 'createdAt' | 'cooked'>) => Promise<void>;
}

export default function AddMealModal({ open, onClose, onAdd }: Props) {
  const handleSubmit = async (values: MealFormValues) => {
    await onAdd(values);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Log a new meal">
      <MealForm submitLabel="Add meal" onSubmit={handleSubmit} />
    </Modal>
  );
}
