// src/components/settings/StationManager.jsx
'use client';

import { useState } from 'react';
import { apiClient } from '@/utils/apiClient';
import StationDialog from './StationDialog';

export default function StationManager({ config, onUpdate }) {
    const [stations, setStations] = useState(config.stationLocations || []);
    const [editingStation, setEditingStation] = useState(null);
    const [showDialog, setShowDialog] = useState(false);

    const handleSave = async (stationData) => {
        try {
            const response = await apiClient('/api/user/lotw-stations', {
                method: 'POST',
                body: JSON.stringify(stationData),
            });
            if (response.success) {
                setStations(response.data);
                setShowDialog(false);
                setEditingStation(null);
                onUpdate();
            }
        } catch (err) {
            alert('保存失败: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('确定删除此台站吗？')) return;
        try {
            const response = await apiClient(`/api/user/lotw-stations?id=${id}`, {
                method: 'DELETE',
            });
            if (response.success) {
                setStations(response.data);
                onUpdate();
            }
        } catch (err) {
            alert('删除失败: ' + err.message);
        }
    };

    const handleSetDefault = async (id) => {
        const station = stations.find(s => s.id === id);
        if (!station) return;
        await handleSave({ ...station, default: true });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-foreground-muted">已配置的台站 ({stations.length})</h4>
                <button
                    onClick={() => { setEditingStation(null); setShowDialog(true); }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                >
                    添加台站
                </button>
            </div>

            {stations.length === 0 ? (
                <p className="text-foreground-muted text-sm">暂无台站，请添加</p>
            ) : (
                <div className="space-y-2">
                    {stations.map((station) => (
                        <div key={station.id} className="flex items-center justify-between bg-glass rounded-xl p-3">
                            <div>
                                <p className="font-medium text-foreground">{station.name}</p>
                                <div className="flex flex-wrap gap-2 text-xs text-foreground-muted">
                                    <span>DXCC: {station.dxcc}</span>
                                    <span>Grid: {station.grid}</span>
                                    <span>ITU: {station.itu}</span>
                                    <span>CQ: {station.cqz}</span>
                                    {station.iota && <span>IOTA: {station.iota}</span>}
                                    {station.default && <span className="text-blue-400">默认</span>}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setEditingStation(station); setShowDialog(true); }}
                                    className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                    编辑
                                </button>
                                {!station.default && (
                                    <button
                                        onClick={() => handleSetDefault(station.id)}
                                        className="text-sm text-green-400 hover:text-green-300"
                                    >
                                        设为默认
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(station.id)}
                                    className="text-sm text-red-400 hover:text-red-300"
                                >
                                    删除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showDialog && (
                <StationDialog
                    station={editingStation}
                    callsign={config.callsign}
                    onClose={() => { setShowDialog(false); setEditingStation(null); }}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}