export default function DuplicateWarning({ existing }) {
  if (!existing) return null;
  return <div className="text-yellow-600">⚠️ 已存在与 {existing.call_sign} 的通联记录</div>;
}
