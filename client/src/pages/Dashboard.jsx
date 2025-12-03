import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Briefcase, Factory, AlertTriangle, CheckCircle, Clock, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

const Dashboard = () => {
    const navigate = useNavigate();
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empsRes, projsRes, prodRes, ironRes, cementRes] = await Promise.all([
                    axios.get('/api/employees'),
                    axios.get('/api/projects'),
                    axios.get('/api/storage/production'),
                    axios.get('/api/storage/iron'),
                    axios.get('/api/storage/cement')
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
                <h1 className="page-title">Executive Dashboard</h1>
            </div>

            {/* Key Metrics Grid */}
            <div className="stats-grid">
                <div className="stat-card" onClick={() => navigate('/employees')}>
                    <div className="stat-icon-wrapper bg-blue-light">
                        <Users className="text-blue" size={24} />
                    </div>
                    <div>
                        <p className="stat-label">Total Employees</p>
                        <h3 className="stat-value">{stats.employees}</h3>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/tasks')}>
                    <div className="stat-icon-wrapper bg-purple-light">
                        <Briefcase className="text-purple" size={24} />
                    </div>
                    <div>
                        <p className="stat-label">Active Tasks</p>
                        <h3 className="stat-value">{stats.projects}</h3>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/storage')}>
                    <div className="stat-icon-wrapper bg-green-light">
                        <Factory className="text-green" size={24} />
                    </div>
                    <div>
                        <p className="stat-label">Production Items</p>
                        <h3 className="stat-value">{stats.productionItems}</h3>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/storage')}>
                    <div className="stat-icon-wrapper bg-orange-light">
                        <AlertTriangle className="text-orange" size={24} />
                    </div>
                    <div>
                        <p className="stat-label">Low Stock Alerts</p>
                        <h3 className="stat-value">{stats.lowStockCount}</h3>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Project Status Chart */}
                <div className="card chart-card">
                    <h3 className="card-title">Task Status Distribution</h3>
                    {projectStatus.length > 0 ? (
                        <PieChart data={projectStatus} />
                    ) : (
                        <p className="no-data">No task data available</p>
                    )}
                </div>

                {/* Employee Roles Chart */}
                <div className="card chart-card">
                    <h3 className="card-title">Employee Roles Breakdown</h3>
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
                        <h3 className="card-title">Recent Tasks</h3>
                        <button className="btn-link" onClick={() => navigate('/tasks')}>View All <ArrowRight size={16} /></button>
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
                        <h3 className="card-title">Inventory Alerts</h3>
                        <button className="btn-link" onClick={() => navigate('/storage')}>Manage <ArrowRight size={16} /></button>
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
                                <p>All inventory levels are healthy</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-container {
                    padding-bottom: 2rem;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-sm);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                .stat-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-label {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    font-weight: 500;
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    line-height: 1.2;
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                .chart-card {
                    min-height: 300px;
                    display: flex;
                    flex-direction: column;
                }
                
                /* Pie Chart */
                .pie-chart-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 2rem;
                    flex: 1;
                }
                .pie-chart {
                    width: 160px;
                    height: 160px;
                    border-radius: 50%;
                }
                .pie-legend {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                }
                .legend-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .legend-value {
                    font-weight: 600;
                    margin-left: auto;
                }

                /* Bar Chart */
                .bar-chart {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    padding-top: 1rem;
                }
                .bar-row {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .bar-label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.875rem;
                    font-weight: 500;
                }
                .bar-bg {
                    height: 8px;
                    background: var(--bg-secondary);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .bar-fill {
                    height: 100%;
                    background: var(--primary-color);
                    border-radius: 4px;
                }

                .lists-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 1.5rem;
                }
                .list-card {
                    display: flex;
                    flex-direction: column;
                }
                .card-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .btn-link {
                    background: none;
                    border: none;
                    color: var(--primary-color);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                .list-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .list-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem;
                    border-radius: var(--radius-md);
                    background: var(--bg-secondary);
                    transition: background 0.2s;
                }
                .list-item:hover {
                    background: #f1f5f9;
                }
                .list-item-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                }
                .list-item-details {
                    flex: 1;
                }
                .item-title {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: var(--text-primary);
                }
                .item-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    color: var(--text-secondary);
                    text-align: center;
                }

                /* Utility Colors */
                .bg-blue-light { background: #dbeafe; }
                .text-blue { color: #2563eb; }
                .bg-purple-light { background: #f3e8ff; }
                .text-purple { color: #9333ea; }
                .bg-green-light { background: #dcfce7; }
                .text-green { color: #16a34a; }
                .bg-orange-light { background: #ffedd5; }
                .text-orange { color: #ea580c; }
                .bg-red-light { background: #fee2e2; }
                .text-red { color: #dc2626; }

                @media (max-width: 768px) {
                    .charts-grid, .lists-grid {
                        grid-template-columns: 1fr;
                    }
                    .pie-chart-container {
                        flex-direction: column;
                        gap: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
