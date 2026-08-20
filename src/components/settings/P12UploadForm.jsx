// src/components/settings/P12UploadForm.jsx
'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function P12UploadForm({ onSuccess, existingCallsign }) {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setFile(acceptedFiles[0]);
                setMessage(null);
            }
        },
        accept: { 'application/x-pkcs12': ['.p12'] },
        maxFiles: 1,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !password) {
            setMessage({ type: 'error', text: '请选择 .p12 文件并输入密码' });
            return;
        }

        setUploading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('p12', file);
            formData.append('password', password);

            const response = await fetch('/api/user/lotw-config', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || '上传失败');
            }
            setMessage({ type: 'success', text: `证书导入成功！呼号: ${result.data.callsign}` });
            setFile(null);
            setPassword('');
            onSuccess(result.data);
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            {existingCallsign && (
                <div className="bg-glass rounded-xl p-4 mb-6">
                    <p className="text-sm text-foreground-muted">当前证书呼号</p>
                    <p className="text-xl font-bold text-foreground">{existingCallsign}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                        isDragActive ? 'border-blue-400 bg-blue-500/10' : 'border-glass hover:border-blue-400/50'
                    }`}
                >
                    <input {...getInputProps()} />
                    {file ? (
                        <div>
                            <p className="text-foreground">{file.name}</p>
                            <p className="text-xs text-foreground-muted">{(file.size / 1024).toFixed(1)} KB</p>
                            <button 
                                type="button" 
                                className="mt-2 text-sm text-red-400 hover:text-red-300"
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            >
                                移除
                            </button>
                        </div>
                    ) : (
                        <div>
                            <svg className="w-12 h-12 mx-auto mb-3 text-foreground-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-foreground-muted">拖拽 .p12 文件到这里，或点击选择</p>
                            <p className="text-xs text-foreground-muted mt-1">支持 .p12 证书文件</p>
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground-muted">证书密码</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="输入 .p12 文件的密码"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={uploading || !file}
                    className="mt-4 w-full py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    {uploading ? '上传中...' : (existingCallsign ? '更新证书' : '导入证书')}
                </button>

                {message && (
                    <div className={`mt-4 p-3 rounded-xl text-sm ${
                        message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    );
}