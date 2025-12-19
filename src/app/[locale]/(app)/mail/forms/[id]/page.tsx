import { notFound } from 'next/navigation';
import FormEditor from '@/components/forms/FormEditor';
import { getForm } from '@/lib/actions/forms';

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getForm(id);

  if (!form) {
    notFound();
  }

  return <FormEditor form={form} />;
}
