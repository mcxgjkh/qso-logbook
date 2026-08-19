import LogForm from '@/components/logs/LogForm';

export default function LogDetailPage({ params }) {
  return <LogForm mode="edit" logId={params.id} />;
}
