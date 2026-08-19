import { useState } from 'react';
import { parseADIF } from '@/lib/adif/parser';

export default function ADIFImporter() {
  const [file, setFile] = useState(null);
  const handleUpload = async () => { /* 调用 API */ };
  return <div>{/* 文件上传区域 */}</div>;
}
