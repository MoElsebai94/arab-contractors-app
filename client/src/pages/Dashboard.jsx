import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Briefcase, Factory, AlertTriangle, CheckCircle, Clock, Activity, ArrowRight, UserCheck, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { useLanguage } from '../context/LanguageContext';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        employees: 0,
        projects: 0,
        productionItems: 0,
        lowStockCount: 0
    });
    const [projectStatus, setProjectStatus] = useState([]);
    const [employeeRoles, setEmployeeRoles] = useState([]);
    const [recentProjects, setRecentProjects] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [employeeWorkload, setEmployeeWorkload] = useState([]);
    const [materialSummary, setMaterialSummary] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empsRes, projsRes, prodRes, ironRes, cementRes, workloadRes, materialSummaryRes] = await Promise.all([
                    axios.get('/api/employees'),
                    axios.get('/api/projects'),
                    axios.get('/api/storage/production'),
                    axios.get('/api/storage/iron'),
                    axios.get('/api/storage/cement'),
                    axios.get('/api/employees/workload').catch(() => ({ data: { data: [] } })),
                    axios.get('/api/project-materials/summary').catch(() => ({ data: { data: [] } }))
                ]);

                const employees = empsRes.data.data;
                const activeEmployees = employees.filter(e => e.is_active === 1);
                const projects = projsRes.data.data;
                const production = prodRes.data.data;
                const iron = ironRes.data.data;
                const cement = cementRes.data.data;

                // Process Project Status
                const statusCounts = projects.reduce((acc, curr) => {
                    acc[curr.status] = (acc[curr.status] || 0) + 1;
                    return acc;
                }, {});
                const statusData = [
                    { label: 'Planned', value: statusCounts['Planned'] || 0, color: '#64748b' },
                    { label: 'In Progress', value: statusCounts['In Progress'] || 0, color: '#3b82f6' },
                    { label: 'Completed', value: statusCounts['Completed'] || 0, color: '#22c55e' },
                    { label: 'On Hold', value: statusCounts['On Hold'] || 0, color: '#f59e0b' }
                ].filter(d => d.value > 0);

                // Process Employee Roles (Only Active)
                const roleCounts = activeEmployees.reduce((acc, curr) => {
                    acc[curr.role] = (acc[curr.role] || 0) + 1;
                    return acc;
                }, {});
                const roleData = Object.entries(roleCounts)
                    .map(([label, value]) => ({ label, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5); // Top 5 roles

                // Low Stock Logic (Thresholds: Iron < 100, Cement < 100)
                const lowIron = iron.filter(i => i.quantity < 100).map(i => ({
                    ...i,
                    type: 'Iron',
                    name: `Iron Φ${i.diameter.toString().replace(/[^0-9.]/g, '')}`
                }));
                const lowCement = cement.filter(i => i.quantity < 100).map(i => ({ ...i, type: 'Cement', name: i.type }));
                const allLowStock = [...lowIron, ...lowCement];

                setStats({
                    employees: activeEmployees.length,
                    projects: projects.length,
                    productionItems: production.length,
                    lowStockCount: allLowStock.length
                });

                setProjectStatus(statusData);
                setEmployeeRoles(roleData);
                setRecentProjects(projects.slice(0, 5)); // Assuming API returns newest first or we slice first 5
                setLowStockItems(allLowStock.slice(0, 5));

                // Process employee workload (show busy employees)
                const workload = workloadRes.data.data || [];
                const busyEmployees = workload
                    .filter(w => w.active_projects >= 2)
                    .sort((a, b) => b.active_projects - a.active_projects)
                    .slice(0, 5);
                setEmployeeWorkload(busyEmployees);

                // Process material summary
                const matSummary = materialSummaryRes.data.data || [];
                setMaterialSummary(matSummary.slice(0, 5));

                setLoading(false);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Simple Pie Chart Component using Conic Gradient
    const PieChart = ({ data }) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = 0;
        const gradientParts = data.map(item => {
            const percentage = (item.value / total) * 100;
            const start = currentAngle;
            const end = currentAngle + percentage;
            currentAngle = end;
            return `${item.color} ${start}% ${end}%`;
        });
        const gradient = `conic-gradient(${gradientParts.join(', ')})`;

        return (
            <div className="pie-chart-container">
                <div className="pie-chart" style={{ background: gradient }}></div>
                <div className="pie-legend">
                    {data.map(item => (
                        <div key={item.label} className="legend-item">
                            <span className="legend-dot" style={{ background: item.color }}></span>
                            <span className="legend-label">{item.label}</span>
                            <span className="legend-value">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="dashboard-container">
            <div className="page-header">
                <h1 className="page-title">{t('executiveDashboard')}</h1>
            </div>

            {/* Key Metrics Grid */}
            <div className="stats-grid">
                <div className="stat-card" onClick={() => navigate('/employees')}>
                    <div className="stat-icon-wrapper bg-blue-light">
                        <Users className="text-blue" size={24} />
                    </div>
                    <div>
                        <p className="stat-label">{t('totalEmployees')}</p>
                        <h3 className="stat-value">{stats.employees}</h3>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/tasks')}>
                    <div className="stat-icon-wrapper bg-purple-light">
                        <Briefcase className="text-purple" size={24} />
                    </div>
                    <div>
                        <p className="stat-label">{t('activeTasks')}</p>
                        <h3 className="stat-value">{stats.projects}</h3>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/storage')}>
                    <div className="stat-icon-wrapper bg-green-light">
                        <Factory className="text-green" size={24} />
                    </div>
                    <div>
                        <p className="stat-label">{t('productionItems')}</p>
                        <h3 className="stat-value">{stats.productionItems}</h3>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/storage')}>
                    <div className="stat-icon-wrapper bg-orange-light">
                        <AlertTriangle className="text-orange" size={24} />
                    </div>
                    <div>
                        <p className="stat-label">{t('lowStockAlerts')}</p>
                        <h3 className="stat-value">{stats.lowStockCount}</h3>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Project Status Chart */}
                <div className="card chart-card">
                    <h3 className="card-title">{t('taskStatusDistribution')}</h3>
                    {projectStatus.length > 0 ? (
                        <PieChart data={projectStatus} />
                    ) : (
                        <p className="no-data">No task data available</p>
                    )}
                </div>

                {/* Employee Roles Chart */}
                <div className="card chart-card">
                    <h3 className="card-title">{t('employeeRolesBreakdown')}</h3>
                    <div className="bar-chart">
                        {employeeRoles.map((role, index) => (
                            <div key={index} className="bar-row">
                                <div className="bar-label">
                                    <span>{role.label}</span>
                                    <span className="text-secondary">{role.value}</span>
                                </div>
                                <div className="bar-bg">
                                    <div
                                        className="bar-fill"
                                        style={{ width: `${(role.value / Math.max(...employeeRoles.map(r => r.value))) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lists-grid">
                {/* Recent Projects */}
                <div className="card list-card">
                    <div className="card-header-row">
                        <h3 className="card-title">{t('recentTasks')}</h3>
                        <button className="btn-link" onClick={() => navigate('/tasks')}>{t('viewAll')} <ArrowRight size={16} /></button>
                    </div>
                    <div className="list-content">
                        {recentProjects.map(project => (
                            <div key={project.id} className="list-item">
                                <div className="list-item-icon">
                                    <Activity size={18} className="text-secondary" />
                                </div>
                                <div className="list-item-details">
                                    <p className="item-title">{project.name}</p>
                                    <p className="item-subtitle">{project.status}</p>
                                </div>
                                <span className={`badge badge-${project.priority.toLowerCase()}`}>{project.priority}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="card list-card">
                    <div className="card-header-row">
                        <h3 className="card-title">{t('inventoryAlerts')}</h3>
                        <button className="btn-link" onClick={() => navigate('/storage')}>{t('manage')} <ArrowRight size={16} /></button>
                    </div>
                    <div className="list-content">
                        {lowStockItems.length > 0 ? (
                            lowStockItems.map((item, idx) => (
                                <div key={idx} className="list-item">
                                    <div className="list-item-icon bg-red-light">
                                        <AlertTriangle size={18} className="text-red" />
                                    </div>
                                    <div className="list-item-details">
                                        <p className="item-title">{item.name}</p>
                                        <p className="item-subtitle">{item.type} Store</p>
                                    </div>
                                    <span className="text-red font-bold">{item.quantity} units</span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <CheckCircle size={32} className="text-green mb-2" />
                                <p>{t('inventoryHealthy')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Employee Workload Section */}
            {employeeWorkload.length > 0 && (
                <div className="workload-section">
                    <div className="card list-card">
                        <div className="card-header-row">
                            <h3 className="card-title">
                                <UserCheck size={18} />
                                {t('employeeWorkload') || 'Employee Workload'}
                            </h3>
                            <button className="btn-link" onClick={() => navigate('/employees')}>{t('viewAll')} <ArrowRight size={16} /></button>
                        </div>
                        <div className="list-content">
                            {employeeWorkload.map((emp, idx) => (
                                <div key={idx} className="list-item">
                                    <div className={`list-item-icon ${emp.active_projects >= 3 ? 'bg-red-light' : 'bg-orange-light'}`}>
                                        <Users size={18} className={emp.active_projects >= 3 ? 'text-red' : 'text-orange'} />
                                    </div>
                                    <div className="list-item-details">
                                        <p className="item-title">{emp.name}</p>
                                        <p className="item-subtitle">{emp.role || 'No Role'}</p>
                                    </div>
                                    <span className={`font-bold ${emp.active_projects >= 3 ? 'text-red' : 'text-orange'}`}>
                                        {emp.active_projects} {t('projects') || 'projects'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
