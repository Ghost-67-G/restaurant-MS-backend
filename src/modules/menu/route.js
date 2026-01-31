const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const menuValidation = require('./validation');
const menuController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/items')
  .post(auth(PERMISSIONS.MENU.MANAGE), validate(menuValidation.createMenuItem), menuController.createMenuItem)
  .get(auth(PERMISSIONS.MENU.VIEW), validate(menuValidation.getMenuItems), menuController.getMenuItems);

router
  .route('/items/:menuItemId')
  .get(auth(PERMISSIONS.MENU.VIEW), validate(menuValidation.getMenuItem), menuController.getMenuItem)
  .patch(auth(PERMISSIONS.MENU.MANAGE), validate(menuValidation.updateMenuItem), menuController.updateMenuItem)
  .delete(auth(PERMISSIONS.MENU.MANAGE), validate(menuValidation.deleteMenuItem), menuController.deleteMenuItem);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Menu item management
 */

/**
 * @swagger
 * /menu/items:
 *   post:
 *     summary: Create a menu item
 *     description: Only authenticated users can create menu items.
 *     tags: [Menu]
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
 *               - categoryId
 *               - price
 *               - costPrice
 *             properties:
 *               name:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               price:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               isAvailable:
 *                 type: boolean
 *               modifiers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *             example:
 *               name: Margherita Pizza
 *               categoryId: 507f1f77bcf86cd799439011
 *               price: 12.99
 *               costPrice: 5.50
 *               isAvailable: true
 *               modifiers:
 *                 - name: Extra Cheese
 *                   price: 2.00
 *                 - name: Gluten Free Base
 *                   price: 3.00
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/MenuItem'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all menu items
 *     description: Retrieve all menu items with optional filtering.
 *     tags: [Menu]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Menu item name
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Category ID
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Availability status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of menu items
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
 *                     $ref: '#/components/schemas/MenuItem'
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
 * /menu/items/{id}:
 *   get:
 *     summary: Get a menu item
 *     description: Retrieve menu item by id.
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/MenuItem'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a menu item
 *     description: Only authenticated users can update menu items.
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               price:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               isAvailable:
 *                 type: boolean
 *               modifiers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *             example:
 *               name: Margherita Pizza
 *               price: 13.99
 *               isAvailable: false
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/MenuItem'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a menu item
 *     description: Only authenticated users can delete menu items.
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item id
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
