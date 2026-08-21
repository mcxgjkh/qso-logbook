// src/components/logs/ADIFImporter.js
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { apiClient } from '@/utils/apiClient';
import { useRouter } from 'next/navigation';

export default function ADIFImporter() {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previews, setPreviews] = useState({});

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    setFiles(acceptedFiles);
    setError(null);
    setResult(null);
    setPreviews({});

    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setPreviews((prev) => ({
          ...prev,
          [file.name]: content.slice(0, 500) + (content.length > 500 ? '...' : ''),
        }));
      };
      reader.readAsText(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.adi', '.adif', '.txt'],
      'application/octet-stream': ['.adi', '.adif'],
    },
    multiple: true,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const allResults = [];
      let totalInserted = 0;
      let totalDuplicates = 0;
      let totalSkipped = 0;

      for (const file of files) {
        const content = await file.text();
        const response = await apiClient('/api/qso/logs/batch', {
          method: 'POST',
          body: JSON.stringify({ adif_content: content }),
        });
        const data = response.data;
        totalInserted += data.inserted || 0;
        totalDuplicates += data.duplicates || 0;
        totalSkipped += data.skipped || 0;
        allResults.push({
          fileName: file.name,
          inserted: data.inserted || 0,
          duplicates: data.duplicates || 0,
          skipped: data.skipped || 0,
        });
      }

      setResult({
        inserted: totalInserted,
        duplicates: totalDuplicates,
        skipped: totalSkipped,
        details: allResults,
      });

      if (totalInserted > 0) {
        setTimeout(() => router.push('/logs'), 3000);
      }
    } catch (err) {
      setError(err.message || '导入失败');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setPreviews({});
    setResult(null);
    setError(null);
  };

  return (
    <div className="glass-card rounded-2xl p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">导入 ADIF 文件</h2>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
          isDragActive ? 'border-blue-400 bg-blue-500/10' : 'border-glass hover:border-blue-400/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-foreground-muted">
          <svg className="w-12 h-12 mx-auto mb-4 text-foreground-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {isDragActive ? (
            <p>释放文件以上传</p>
          ) : (
            <>
              <p>拖拽一个或多个 ADIF 文件到这里，或点击选择</p>
              <p className="text-xs mt-2">支持 .adi, .adif, .txt（可多选）</p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((file) => (
            <div key={file.name} className="p-4 bg-glass rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-foreground">{file.name}</span>
                  <span className="text-foreground-muted text-sm ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={() => {
                    const newFiles = files.filter((f) => f.name !== file.name);
                    setFiles(newFiles);
                    const newPreviews = { ...previews };
                    delete newPreviews[file.name];
                    setPreviews(newPreviews);
                  }}
                  className="text-sm text-foreground-muted hover:text-foreground"
                >
                  移除
                </button>
              </div>
              {previews[file.name] && (
                <pre className="mt-2 text-xs text-foreground-muted bg-black/20 p-2 rounded max-h-40 overflow-auto">
                  {previews[file.name]}
                </pre>
              )}
            </div>
          ))}
          <button
            onClick={handleClear}
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            清空所有文件
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
          <p>成功导入 {result.inserted} 条记录</p>
          {result.duplicates > 0 && (
            <p className="text-yellow-400 mt-1">跳过 {result.duplicates} 条重复记录</p>
          )}
          {result.skipped > 0 && (
            <p className="text-yellow-400 mt-1">跳过 {result.skipped} 条无效记录</p>
          )}
          {result.details && result.details.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-foreground-muted">查看各文件详情</summary>
              <ul className="mt-1 text-xs space-y-1">
                {result.details.map((detail) => (
                  <li key={detail.fileName}>
                    {detail.fileName}: 导入 {detail.inserted} 条, 重复 {detail.duplicates} 条,
                    无效 {detail.skipped} 条
                  </li>
                ))}
              </ul>
            </details>
          )}
          {result.inserted > 0 && <p className="text-xs mt-1">即将跳转到日志列表...</p>}
        </div>
      )}

      <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-glass">
        <button
          type="button"
          onClick={() => router.push('/logs')}
          className="px-6 py-2 border border-glass rounded-xl text-sm font-medium text-foreground-muted bg-glass hover:bg-glass-hover transition"
        >
          取消
        </button>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {uploading ? '导入中...' : `导入 (${files.length} 个文件)`}
        </button>
      </div>
    </div>
  );
}