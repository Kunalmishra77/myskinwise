import Link from "next/link";
import { notFound } from "next/navigation";
import { getExpertStore } from "@/lib/expert/storage";
import { Workspace } from "@/app/admin/consultations/[id]/workspace";

export const dynamic = "force-dynamic";

export default async function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getExpertStore();
  if (!store) notFound();

  const detail = await store.getConsultation(id);
  if (!detail) notFound();

  return (
    <div>
      <Link href="/admin/consultations" className="text-sm text-rose-ink hover:underline">
        ← All consultations
      </Link>
      <Workspace detail={detail} />
    </div>
  );
}
