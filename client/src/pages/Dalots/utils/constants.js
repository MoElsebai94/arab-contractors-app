export const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : '/api';

export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

export const DIMENSION_PRESETS = [
    '1D100x100', '1D150X200', '2D100x100', '2D150X200', '2D200X100',
    '1D200X100', '1D300X300', '2D300X300', '1D150X150'
];

export const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' },
    { value: 'in_progress', label: 'In Progress', labelAr: 'قيد التنفيذ' },
    { value: 'finished', label: 'Finished', labelAr: 'مكتمل' },
    { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغى' }
];

export const SECTION_CONFIG = [
    { id: '1', name: 'Section 1', startPK: 0, endPK: 48000, type: 'main', row: 0, color: '#94a3b8' },
    { id: '2', name: 'Section 2', startPK: 48000, endPK: 80000, type: 'continuous', fromSection: '1', row: 0, color: '#94a3b8' },
    { id: '3', name: 'Section 3', startPK: 0, endPK: 20000, type: 'branch', fromSection: '2', branchPK: 48000, row: 1, color: '#64748b' }
];
