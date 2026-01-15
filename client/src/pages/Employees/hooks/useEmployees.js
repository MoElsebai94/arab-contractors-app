import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export const useEmployees = () => {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/employees');
            setEmployees((response.data.data || []).filter(e => e && e.id));
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const roleCounts = useMemo(() => {
        if (!Array.isArray(employees)) return {};
        return employees.reduce((acc, emp) => {
            if (!emp || emp.is_active === 0) return acc;
            const role = emp.role || 'Unassigned';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});
    }, [employees]);

    const uniqueRoles = useMemo(() => {
        if (!Array.isArray(employees)) return [];
        const roles = new Set(employees.map(e => e.role).filter(r => r && r.trim() !== ''));
        return Array.from(roles).sort();
    }, [employees]);

    return {
        loading,
        employees,
        setEmployees,
        fetchEmployees,
        roleCounts,
        uniqueRoles
    };
};

export const useEmployeeFilters = (employees) => {
    const [selectedRole, setSelectedRole] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(true);

    const filteredEmployees = useMemo(() => {
        let result = employees;
        if (selectedRole !== 'All') {
            result = result.filter(e => e.role === selectedRole);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(e => e.name.toLowerCase().includes(query));
        }
        if (!showInactive) {
            result = result.filter(e => e.is_active !== 0);
        }
        // Sort by Role then Name
        return [...result].sort((a, b) => {
            const roleCompare = (a.role || '').localeCompare(b.role || '');
            if (roleCompare !== 0) return roleCompare;
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [employees, selectedRole, searchQuery, showInactive]);

    return {
        selectedRole,
        setSelectedRole,
        searchQuery,
        setSearchQuery,
        showInactive,
        setShowInactive,
        filteredEmployees
    };
};
