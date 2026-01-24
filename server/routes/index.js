/**
 * Routes Index
 * Central export for all route modules
 */

const authRoutes = require('./auth');
const employeesRoutes = require('./employees');
const projectsRoutes = require('./projects');
const attendanceRoutes = require('./attendance');

module.exports = {
    authRoutes,
    employeesRoutes,
    projectsRoutes,
    attendanceRoutes
};
