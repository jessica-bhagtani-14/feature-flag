// backend/src/controllers/flagRuleController.js
const flagRuleService = require('../services/flagRuleService');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

class FlagRuleController {
  // Get all rules for a specific flag
  getFlagRules = asyncHandler(async (req, res) => {
    const { appId, flagId } = req.params;
    
    // Verify flag exists and belongs to the app
    await flagRuleService.verifyFlagOwnership(flagId, appId);
    
    const rules = await flagRuleService.getRulesByFlagId(flagId);

    if (!rules || rules.length === 0) {
      return res.json({
        success: true,
        data: [],
        total: 0
      });
    }
    
    logger.info(`Retrieved ${rules.length} rules for flag ${flagId}`, {
      appId,
      flagId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: rules,
      total: rules.length
    });
  });

  getFlagRuleById = asyncHandler(async (req, res) => {
    const { appId, flagId, ruleId } = req.params;
    console.log(ruleId);
    // Verify flag exists and belongs to the app
    await flagRuleService.verifyFlagOwnership(flagId, appId);
    
    const rules = await flagRuleService.getRulesByRuleId(ruleId);

    if (!rules || rules.length === 0) {
      return res.json({
        success: true,
        data: [],
        total: 0
      });
    }
    
    logger.info(`Retrieved rule for id ${ruleId}`, {
      appId,
      flagId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: rules,
      total: rules.length
    });
  });


  // Create a new rule for a flag
  createFlagRule = asyncHandler(async (req, res) => {
    const { appId, flagId } = req.params;
    const ruleData = req.body;

    // Verify flag exists and belongs to the app
    await flagRuleService.verifyFlagOwnership(flagId, appId);

    // Add flag_id to rule data
    ruleData.flag_id = parseInt(flagId);

    const newRule = await flagRuleService.createRule(ruleData);
    
    logger.info('Flag rule created successfully', {
      ruleId: newRule.id,
      flagId,
      appId,
      type: newRule.type,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: newRule,
      message: 'Flag rule created successfully'
    });
  });

  // Update a flag rule
  updateFlagRule = asyncHandler(async (req, res) => {
    const { appId, flagId, ruleId } = req.params;
    const updateData = req.body;

    // Verify flag exists and belongs to the app
    await flagRuleService.verifyFlagOwnership(flagId, appId);

    // Verify rule exists and belongs to the flag
    await flagRuleService.verifyRuleOwnership(ruleId, flagId);

    const updatedRule = await flagRuleService.updateRule(ruleId, updateData);

    logger.info('Flag rule updated successfully', {
      ruleId,
      flagId,
      appId,
      updateData,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: updatedRule,
      message: 'Flag rule updated successfully'
    });
  });

  // Delete a flag rule
  deleteFlagRule = asyncHandler(async (req, res) => {
    const { appId, flagId, ruleId } = req.params;

    // Verify flag exists and belongs to the app
    await flagRuleService.verifyFlagOwnership(flagId, appId);

    // Verify rule exists and belongs to the flag
    await flagRuleService.verifyRuleOwnership(ruleId, flagId);

    await flagRuleService.deleteRule(ruleId);

    logger.info('Flag rule deleted successfully', {
      ruleId,
      flagId,
      appId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Flag rule deleted successfully'
    });
  });

  // Get rule statistics for a flag
  getFlagRuleStats = asyncHandler(async (req, res) => {
    const { appId, flagId } = req.params;

    // Verify flag exists and belongs to the app
    await flagRuleService.verifyFlagOwnership(flagId, appId);

    const stats = await flagRuleService.getRuleStats(flagId);

    res.json({
      success: true,
      data: stats
    });
  });
}

module.exports = new FlagRuleController();