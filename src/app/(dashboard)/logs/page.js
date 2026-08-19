import LogTable from '@/components/logs/LogTable';
import LogFilters from '@/components/logs/LogFilters';
import LogStats from '@/components/logs/LogStats';

export default function LogsPage() {
  return (
    <div>
      <LogStats />
      <LogFilters />
      <LogTable />
    </div>
  );
}
