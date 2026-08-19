import { useLoTW } from '@/hooks/useLoTW';

export default function LoTWUploader() {
  const { upload, history, loading } = useLoTW();
  return <div>{/* 上传按钮 + 历史列表 */}</div>;
}
