const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const taxValidation = require('./validation');
const taxController = require('./controller');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();

router
  .route('/')
  .post(auth(PERMISSIONS.TAX.MANAGE), validate(taxValidation.createTax), taxController.createTax)
  .get(auth(PERMISSIONS.TAX.VIEW), validate(taxValidation.getTaxes), taxController.getTaxes);

router.route('/active').get(auth(PERMISSIONS.TAX.VIEW), taxController.getActiveTax);

router
  .route('/:taxId')
  .get(auth(PERMISSIONS.TAX.VIEW), validate(taxValidation.getTax), taxController.getTax)
  .patch(auth(PERMISSIONS.TAX.MANAGE), validate(taxValidation.updateTax), taxController.updateTax)
  .delete(auth(PERMISSIONS.TAX.MANAGE), validate(taxValidation.deleteTax), taxController.deleteTax);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Tax
 *   description: Tax configuration management
 */

/**
 * @swagger
 * /tax:
 *   post:
 *     summary: Create tax configuration
 *     description: Only owner can create tax configuration.
 *     tags: [Tax]
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
 *               - percentage
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tax name (GST, VAT, etc.)
 *               percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Tax percentage
 *               isActive:
 *                 type: boolean
 *                 description: Set as active tax
 *             example:
 *               name: GST
 *               percentage: 18
 *               isActive: true
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all tax configurations
 *     description: Authenticated users can retrieve all tax configurations.
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
