// src/components/settings/StationDialog.jsx
'use client';

import { useState, useEffect } from 'react';

export default function StationDialog({ station, callsign, onClose, onSave }) {
    const [form, setForm] = useState({
        name: '',
        dxcc: '',
        grid: '',
        itu: '',
        cqz: '',
        iota: '',
        default: false,
        id: null,
    });

    const [dxccData, setDxccData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 当前可用的CQ和ITU选项
    const [cqOptions, setCqOptions] = useState([]);
    const [ituOptions, setItuOptions] = useState([]);

    // 所有CQ分区（1-40）和ITU分区（1-75）
    const allCq = Array.from({ length: 40 }, (_, i) => i + 1);
    const allItu = Array.from({ length: 75 }, (_, i) => i + 1);

    // 加载DXCC数据
    useEffect(() => {
        fetch('/data/dxcc.json')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load DXCC data');
                return res.json();
            })
            .then(data => {
                setDxccData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // 当DXCC变化时，更新CQ和ITU选项
    const handleDxccChange = (selectedDxcc) => {
        const entity = dxccData.find(d => d.dxcc === parseInt(selectedDxcc));
        if (entity) {
            setCqOptions(entity.cq_zones || []);
            setItuOptions(entity.itu_zones || []);
            // 如果当前选中的分区不在新列表中，则清空
            const currentCq = parseInt(form.cqz);
            const currentItu = parseInt(form.itu);
            if (currentCq && !entity.cq_zones.includes(currentCq)) {
                setForm(prev => ({ ...prev, cqz: '' }));
            }
            if (currentItu && !entity.itu_zones.includes(currentItu)) {
                setForm(prev => ({ ...prev, itu: '' }));
            }
            setForm(prev => ({ ...prev, dxcc: selectedDxcc }));
        } else {
            // 未选择DXCC时，恢复所有分区选项
            setCqOptions(allCq);
            setItuOptions(allItu);
            setForm(prev => ({ ...prev, dxcc: selectedDxcc }));
        }
    };

    useEffect(() => {
        if (station) {
            setForm({
                name: station.name,
                dxcc: station.dxcc,
                grid: station.grid,
                itu: station.itu,
                cqz: station.cqz,
                iota: station.iota || '',
                default: station.default || false,
                id: station.id,
            });
            // 根据已有DXCC设置选项
            const entity = dxccData.find(d => d.dxcc === parseInt(station.dxcc));
            if (entity) {
                setCqOptions(entity.cq_zones || []);
                setItuOptions(entity.itu_zones || []);
            } else {
                setCqOptions(allCq);
                setItuOptions(allItu);
            }
        } else {
            // 新建时，默认显示所有分区选项
            setCqOptions(allCq);
            setItuOptions(allItu);
        }
    }, [station, dxccData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name || !form.dxcc || !form.grid || !form.itu || !form.cqz) {
            alert('请填写所有必填字段');
            return;
        }
        const payload = {
            ...form,
            dxcc: parseInt(form.dxcc),
            itu: parseInt(form.itu),
            cqz: parseInt(form.cqz),
        };
        onSave(payload);
    };

    // DXCC 列表（按名称排序）
    const dxccOptions = dxccData
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(item => ({
            value: item.dxcc,
            label: `${item.name} (${item.prefix})`
        }));

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="glass-card rounded-2xl p-6 max-w-md w-full text-center">
                    <p className="text-foreground-muted">加载DXCC数据中...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="glass-card rounded-2xl p-6 max-w-md w-full text-center">
                    <p className="text-red-400">加载DXCC数据失败: {error}</p>
                    <button
                        onClick={onClose}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl"
                    >
                        关闭
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-foreground mb-4">
                    {station ? '编辑台站' : '添加台站'}
                </h3>
                <p className="text-sm text-foreground-muted mb-4">呼号: {callsign}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground-muted">地址名称 *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="例如: My Home"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-muted">DXCC 实体 *</label>
                        <select
                            value={form.dxcc}
                            onChange={(e) => handleDxccChange(e.target.value)}
                            className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground"
                            required
                        >
                            <option value="">选择 DXCC</option>
                            {dxccOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-muted">网格定位 *</label>
                        <input
                            type="text"
                            value={form.grid}
                            onChange={(e) => setForm({ ...form, grid: e.target.value.toUpperCase() })}
                            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="例如: CN89"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground-muted">ITU 分区 *</label>
                            <select
                                value={form.itu}
                                onChange={(e) => setForm({ ...form, itu: e.target.value })}
                                className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground"
                                required
                            >
                                <option value="">选择 ITU 分区</option>
                                {ituOptions.map((v) => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground-muted">CQ 分区 *</label>
                            <select
                                value={form.cqz}
                                onChange={(e) => setForm({ ...form, cqz: e.target.value })}
                                className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground"
                                required
                            >
                                <option value="">选择 CQ 分区</option>
                                {cqOptions.map((v) => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-muted">IOTA 编号</label>
                        <input
                            type="text"
                            value={form.iota}
                            onChange={(e) => setForm({ ...form, iota: e.target.value })}
                            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="例如: NA-001"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="default"
                            checked={form.default}
                            onChange={(e) => setForm({ ...form, default: e.target.checked })}
                            className="checkbox-custom"
                        />
                        <label htmlFor="default" className="ml-2 text-sm text-foreground-muted">设为默认台站</label>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-glass">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-glass rounded-xl text-sm text-foreground-muted hover:bg-glass-hover transition"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition"
                        >
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}