'use client';
import Modal from './Modal';
import MealForm, { MealFormValues } from './MealForm';
import { Meal } from '@/types';

interface Props {
  open: boolean;
  meal: Meal | null;
  onClose: () => void;
  onEdit: (id: string, fields: MealFormValues) => Promise<void>;
}

export default function EditMealModal({ open, meal, onClose, onEdit }: Props) {
  if (!meal) return null;

  const handleSubmit = async (values: MealFormValues) => {
    await onEdit(meal.id, values);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit: ${meal.name}`}>
      <MealForm initial={meal} submitLabel="Save changes" onSubmit={handleSubmit} />
    </Modal>
  );
}
