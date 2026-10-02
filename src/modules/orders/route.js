const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const orderValidation = require('./validation');
const orderController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/')
  .post(auth(PERMISSIONS.ORDER.CREATE), validate(orderValidation.createOrder), orderController.createOrder)
  .get(auth(PERMISSIONS.ORDER.VIEW), validate(orderValidation.getOrders), orderController.getOrders);

router
  .route('/:orderId')
  .get(auth(PERMISSIONS.ORDER.VIEW), validate(orderValidation.getOrder), orderController.getOrder)
  .patch(auth(PERMISSIONS.ORDER.UPDATE_STATUS), validate(orderValidation.updateOrder), orderController.updateOrder)
  .delete(auth(PERMISSIONS.ORDER.DELETE), validate(orderValidation.deleteOrder), orderController.deleteOrder);

router
  .route('/:orderId/cancel')
  .patch(auth(PERMISSIONS.ORDER.CANCEL), validate(orderValidation.cancelOrder), orderController.cancelOrder);

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
 *               - subtotal
 *               - totalAmount
 *               - paymentMethod
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemId
 *                     - name
 *                     - unitPrice
 *                     - quantity
 *                     - lineTotal
 *                   properties:
 *                     itemId:
 *                       type: string
 *                       description: Item ID reference
 *                     name:
 *                       type: string
 *                       description: Snapshot of item name
 *                     sku:
 *                       type: string
 *                       description: Snapshot of item SKU
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                       description: Snapshot of item unit price
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                     lineTotal:
 *                       type: number
 *                       minimum: 0
 *                     discountAmount:
 *                       type: number
 *                       minimum: 0
 *                     selectedOptions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           priceAdjustment:
 *                             type: number
 *                     note:
 *                       type: string
 *               subtotal:
 *                 type: number
 *                 minimum: 0
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FLAT]
 *               discountValue:
 *                 type: number
 *                 minimum: 0
 *               discountAmount:
 *                 type: number
 *                 minimum: 0
 *               taxName:
 *                 type: string
 *               taxPercentage:
 *                 type: number
 *                 minimum: 0
 *               taxAmount:
 *                 type: number
 *                 minimum: 0
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card]
 *               totalAmount:
 *                 type: number
 *                 minimum: 0
 *               notes:
 *                 type: string
 *             example:
 *               items:
 *                 - itemId: 5ebac534954b54139806c112
 *                   name: Wireless Mouse
 *                   sku: WM-100
 *                   unitPrice: 24.99
 *                   quantity: 2
 *                   lineTotal: 49.98
 *                 - itemId: 5ebac534954b54139806c113
 *                   name: Notebook A5
 *                   sku: NB-A5
 *                   unitPrice: 5.99
 *                   quantity: 1
 *                   lineTotal: 5.99
 *               subtotal: 55.97
 *               taxName: Standard Sales Tax
 *               taxPercentage: 12
 *               taxAmount: 6.72
 *               paymentMethod: card
 *               totalAmount: 62.69
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
 *           enum: [pending, completed, cancelled, voided, refunded]
 *         description: Filter by order status
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [cash, card]
 *         description: Filter by payment method
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
 *                 enum: [pending, completed, cancelled, voided, refunded]
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
