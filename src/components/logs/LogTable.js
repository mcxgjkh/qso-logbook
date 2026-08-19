import { useQSOs } from '@/hooks/useQSOs';
import Pagination from '@/components/common/Pagination';

export default function LogTable() {
  const { qsos, loading } = useQSOs();
  if (loading) return <div>Loading...</div>;
  return (
    <table className="w-full border">
      <thead><tr><th>呼号</th><th>日期</th><th>波段</th><th>模式</th></tr></thead>
      <tbody>
        {qsos.map(q => (
          <tr key={q.id}><td>{q.call_sign}</td><td>{q.qso_date}</td><td>{q.band}</td><td>{q.mode}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
