const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const inventoryValidation = require('./validation');
const inventoryController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/')
  .post(
    auth(PERMISSIONS.INVENTORY.MANAGE),
    validate(inventoryValidation.createInventory),
    inventoryController.createInventory
  )
  .get(
    auth(PERMISSIONS.INVENTORY.VIEW),
    validate(inventoryValidation.getInventoryItems),
    inventoryController.getInventoryItems
  );

router
  .route('/:inventoryId')
  .get(auth(PERMISSIONS.INVENTORY.VIEW), validate(inventoryValidation.getInventory), inventoryController.getInventory)
  .patch(
    auth(PERMISSIONS.INVENTORY.ADJUST),
    validate(inventoryValidation.updateInventory),
    inventoryController.updateInventory
  )
  .delete(
    auth(PERMISSIONS.INVENTORY.MANAGE),
    validate(inventoryValidation.deleteInventory),
    inventoryController.deleteInventory
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management
 */

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create an inventory item
 *     description: Authenticated users can create inventory items.
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *             example:
 *               name: Tomatoes
 *               quantity: 100
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   get:
 *     summary: Get all inventory items
 *     description: Authenticated users can retrieve all inventory items.
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of items
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
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
