const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const orderValidation = require('./validation');
const orderController = require('./controller');

const router = express.Router();

router
  .route('/')
  .post(auth('createOrders'), validate(orderValidation.createOrder), orderController.createOrder)
  .get(auth('viewOrders'), validate(orderValidation.getOrders), orderController.getOrders);

router
  .route('/:orderId')
  .get(auth('viewOrders'), validate(orderValidation.getOrder), orderController.getOrder)
  .patch(auth('updateOrderStatus'), validate(orderValidation.updateOrder), orderController.updateOrder)
  .delete(auth('manageOrders'), validate(orderValidation.deleteOrder), orderController.deleteOrder);

router
  .route('/:orderId/cancel')
  .patch(auth('cancelOrder'), validate(orderValidation.cancelOrder), orderController.cancelOrder);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /order:
 *   post:
 *     summary: Create an order
 *     description: Authenticated users can create orders.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - totalAmount
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - menuItemId
 *                     - name
 *                     - price
 *                     - quantity
 *                   properties:
 *                     menuItemId:
 *                       type: string
 *                       description: Menu item ID reference
 *                     name:
 *                       type: string
 *                       description: Snapshot of menu item name
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       description: Snapshot of menu item price
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                       description: Quantity ordered
 *               totalAmount:
 *                 type: number
 *                 minimum: 0
 *                 description: Total order amount (from frontend)
 *             example:
 *               items:
 *                 - menuItemId: 5ebac534954b54139806c112
 *                   name: Margherita Pizza
 *                   price: 12.99
 *                   quantity: 2
 *                 - menuItemId: 5ebac534954b54139806c113
 *                   name: Coke
 *                   price: 2.50
 *                   quantity: 1
 *               totalAmount: 28.48
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Order'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all orders
 *     description: Authenticated users can retrieve all orders.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed]
 *         description: Filter by order status
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *         description: Filter by user ID who created the order
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. createdAt:desc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of orders
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /order/{id}:
 *   get:
 *     summary: Get an order
 *     description: Authenticated users can fetch order details.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Order'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update an order
 *     description: Authenticated users can update order status.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed]
 *             example:
 *               status: completed
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Order'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete an order
 *     description: Authenticated users can delete orders.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order id
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
