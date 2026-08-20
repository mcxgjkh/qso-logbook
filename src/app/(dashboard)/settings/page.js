// src/app/(dashboard)/settings/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/utils/apiClient';
import P12UploadForm from '@/components/settings/P12UploadForm';
import StationManager from '@/components/settings/StationManager';
import { logError } from '@/lib/logger';

export default function SettingsPage() {
    const { user } = useAuth();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadConfig = async () => {
        try {
            const data = await apiClient('/api/user/lotw-config');
            setConfig(data.data);
        } catch (err) {
            logError('Load config error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleUploadSuccess = (newConfig) => {
        setConfig(newConfig);
    };

    if (loading) {
        return <div className="text-center py-10 text-foreground-muted">加载中...</div>;
    }

    return (
        <div className="glass-card rounded-2xl p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">LoTW 设置</h2>
            
            <P12UploadForm 
                onSuccess={handleUploadSuccess} 
                existingCallsign={config?.callsign} 
            />

            <div className="mt-8 pt-8 border-t border-glass">
                <h3 className="text-xl font-semibold text-foreground mb-4">台站地址管理</h3>
                {config?.hasConfig ? (
                    <StationManager 
                        config={config} 
                        onUpdate={loadConfig} 
                    />
                ) : (
                    <p className="text-foreground-muted text-sm">请先上传 .p12 证书以管理台站地址</p>
                )}
            </div>
        </div>
    );
}