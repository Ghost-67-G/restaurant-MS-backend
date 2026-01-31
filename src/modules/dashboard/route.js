const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const dashboardValidation = require('./validation');
const dashboardController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/today')
  .get(auth(PERMISSIONS.DASHBOARD.VIEW), validate(dashboardValidation.getTodayStats), dashboardController.getTodayStats);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics and analytics
 */

/**
 * @swagger
 * /dashboard/today:
 *   get:
 *     summary: Get today's dashboard statistics
 *     description: Authenticated users can retrieve today's statistics including total orders, total sales, and order status breakdown.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOrders:
 *                   type: number
 *                   description: Total number of orders placed today
 *                   example: 25
 *                 totalSales:
 *                   type: number
 *                   description: Total sales amount for today
 *                   example: 1250.50
 *                 pendingOrders:
 *                   type: number
 *                   description: Number of pending orders today
 *                   example: 5
 *                 completedOrders:
 *                   type: number
 *                   description: Number of completed orders today
 *                   example: 20
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
