import { redirect } from 'next/navigation';

export default async function AdminInstitutionProgramsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/institutions/${id}`);
}
