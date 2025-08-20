#!/usr/bin/env node

/**
 * Validation Guardian Agent
 * Multi-layer validation for n8n workflows using Zod, Joi, AJV, and custom validators
 */

const { z } = require('zod');
const Joi = require('joi');
const Ajv = require('ajv');
const yup = require('yup');

// n8n Workflow Schema using Zod
const N8NWorkflowSchema = z.object({
    name: z.string().min(1),
    nodes: z.array(z.object({
        parameters: z.record(z.any()),
        id: z.string(),
        name: z.string(),
        type: z.string(),
        typeVersion: z.number().optional(),
        position: z.tuple([z.number(), z.number()]),
        credentials: z.record(z.any()).optional(),
        disabled: z.boolean().optional(),
        notes: z.string().optional()
    })).min(1),
    connections: z.record(z.record(z.array(z.array(z.object({
        node: z.string(),
        type: z.string(),
        index: z.number()
    }))))),
    active: z.boolean(),
    settings: z.object({
        executionOrder: z.enum(['v0', 'v1']).optional(),
        saveDataSuccessExecution: z.enum(['all', 'none']).optional(),
        saveManualExecutions: z.boolean().optional(),
        callerPolicy: z.string().optional(),
        errorWorkflow: z.string().optional(),
        timezone: z.string().optional()
    }).optional(),
    staticData: z.any().nullable().optional(),
    tags: z.array(z.string()).optional(),
    triggerCount: z.number().optional(),
    updatedAt: z.string().optional(),
    versionId: z.string().nullable().optional()
});

// Node-specific parameter schemas
const NodeParameterSchemas = {
    'n8n-nodes-base.webhook': z.object({
        httpMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
        path: z.string().min(1),
        responseMode: z.enum(['onReceived', 'lastNode']).optional(),
        responseData: z.string().optional()
    }),
    'n8n-nodes-base.telegramTrigger': z.object({
        updates: z.array(z.string()).optional()
    }),
    'n8n-nodes-base.telegram': z.object({
        resource: z.string(),
        operation: z.string(),
        chatId: z.string().optional(),
        text: z.string().optional()
    }),
    'n8n-nodes-langchain.agent': z.object({
        prompt: z.string().min(1),
        systemMessage: z.string().optional(),
        options: z.object({
            temperature: z.number().min(0).max(1).optional(),
            maxTokens: z.number().optional()
        }).optional()
    }),
    'n8n-nodes-base.postgres': z.object({
        operation: z.enum(['executeQuery', 'insert', 'update', 'delete']),
        query: z.string().optional(),
        table: z.string().optional(),
        schema: z.string().optional()
    }),
    'n8n-nodes-base.openWeatherMap': z.object({
        operation: z.string(),
        cityName: z.string().optional(),
        zipCode: z.string().optional(),
        coordinates: z.object({
            latitude: z.number(),
            longitude: z.number()
        }).optional()
    })
};

class ValidationGuardianAgent {
    constructor() {
        this.ajv = new Ajv({ allErrors: true });
        this.validationLayers = [
            this.validateStructure.bind(this),
            this.validateNodes.bind(this),
            this.validateConnections.bind(this),
            this.validateDataFlow.bind(this),
            this.validateSecurity.bind(this),
            this.validatePerformance.bind(this)
        ];
        this.errors = [];
        this.warnings = [];
    }

    async validateWorkflow(workflow) {
        console.log('\n🛡️ Validation Guardian Agent: Starting multi-layer validation...');
        
        this.errors = [];
        this.warnings = [];
        
        const results = {
            valid: true,
            layers: [],
            errors: [],
            warnings: [],
            fixes: [],
            confidence: 1.0
        };
        
        // Run all validation layers
        for (const validator of this.validationLayers) {
            const layerResult = await validator(workflow);
            results.layers.push(layerResult);
            
            if (!layerResult.valid) {
                results.valid = false;
                results.confidence *= 0.8;
            }
            
            results.errors.push(...(layerResult.errors || []));
            results.warnings.push(...(layerResult.warnings || []));
            results.fixes.push(...(layerResult.fixes || []));
        }
        
        // Final confidence calculation
        results.confidence = Math.max(0.1, results.confidence);
        
        console.log(`\n✅ Validation complete. Valid: ${results.valid}, Confidence: ${results.confidence}`);
        
        return results;
    }

    async validateStructure(workflow) {
        console.log('  📋 Layer 1: Structure validation...');
        
        const result = {
            layer: 'structure',
            valid: true,
            errors: [],
            warnings: [],
            fixes: []
        };
        
        try {
            // Validate with Zod
            N8NWorkflowSchema.parse(workflow);
            console.log('    ✓ Zod validation passed');
        } catch (error) {
            result.valid = false;
            result.errors.push({
                type: 'structure',
                message: 'Workflow structure invalid',
                details: error.errors
            });
            
            // Suggest fixes
            if (error.errors) {
                error.errors.forEach(err => {
                    if (err.path.includes('name') && err.code === 'too_small') {
                        result.fixes.push({
                            path: err.path,
                            fix: 'Add a workflow name',
                            value: 'Automated Workflow'
                        });
                    }
                });
            }
        }
        
        // Validate with Joi as secondary check
        const joiSchema = Joi.object({
            name: Joi.string().required(),
            nodes: Joi.array().min(1).required(),
            connections: Joi.object().required()
        });
        
        const joiResult = joiSchema.validate(workflow);
        if (joiResult.error) {
            result.warnings.push({
                type: 'structure-joi',
                message: joiResult.error.message
            });
        }
        
        return result;
    }

    async validateNodes(workflow) {
        console.log('  🔧 Layer 2: Node validation...');
        
        const result = {
            layer: 'nodes',
            valid: true,
            errors: [],
            warnings: [],
            fixes: []
        };
        
        if (!workflow.nodes || workflow.nodes.length === 0) {
            result.valid = false;
            result.errors.push({
                type: 'nodes',
                message: 'No nodes found in workflow'
            });
            return result;
        }
        
        // Validate each node
        for (const node of workflow.nodes) {
            // Check if node type is valid
            if (!node.type) {
                result.errors.push({
                    type: 'node-type',
                    message: `Node ${node.id} has no type`,
                    nodeId: node.id
                });
                result.valid = false;
            }
            
            // Validate node parameters if schema exists
            const paramSchema = NodeParameterSchemas[node.type];
            if (paramSchema) {
                try {
                    paramSchema.parse(node.parameters || {});
                } catch (error) {
                    result.warnings.push({
                        type: 'node-parameters',
                        message: `Node ${node.name} parameters may be incomplete`,
                        nodeId: node.id,
                        details: error.errors
                    });
                    
                    // Suggest parameter fixes
                    if (node.type === 'n8n-nodes-base.webhook' && !node.parameters?.path) {
                        result.fixes.push({
                            nodeId: node.id,
                            fix: 'Add webhook path',
                            parameter: 'path',
                            value: '/webhook'
                        });
                    }
                }
            }
            
            // Check node position
            if (!node.position || node.position.length !== 2) {
                result.warnings.push({
                    type: 'node-position',
                    message: `Node ${node.name} has invalid position`,
                    nodeId: node.id
                });
                
                result.fixes.push({
                    nodeId: node.id,
                    fix: 'Set default position',
                    parameter: 'position',
                    value: [250, 300]
                });
            }
        }
        
        // Check for required node types
        const nodeTypes = workflow.nodes.map(n => n.type);
        const hasTrigger = nodeTypes.some(t => 
            t.includes('Trigger') || t.includes('webhook')
        );
        
        if (!hasTrigger) {
            result.warnings.push({
                type: 'missing-trigger',
                message: 'Workflow has no trigger node'
            });
        }
        
        return result;
    }

    async validateConnections(workflow) {
        console.log('  🔗 Layer 3: Connection validation...');
        
        const result = {
            layer: 'connections',
            valid: true,
            errors: [],
            warnings: [],
            fixes: []
        };
        
        const nodeIds = new Set(workflow.nodes.map(n => n.id));
        
        // Validate all connections
        for (const [sourceId, outputs] of Object.entries(workflow.connections || {})) {
            // Check if source node exists
            if (!nodeIds.has(sourceId)) {
                result.errors.push({
                    type: 'connection-source',
                    message: `Connection source node ${sourceId} not found`,
                    sourceId
                });
                result.valid = false;
                continue;
            }
            
            // Check outputs
            for (const [outputType, connections] of Object.entries(outputs)) {
                if (!Array.isArray(connections)) continue;
                
                for (const connectionSet of connections) {
                    if (!Array.isArray(connectionSet)) continue;
                    
                    for (const connection of connectionSet) {
                        // Check if target node exists
                        if (!nodeIds.has(connection.node)) {
                            result.errors.push({
                                type: 'connection-target',
                                message: `Connection target node ${connection.node} not found`,
                                sourceId,
                                targetId: connection.node
                            });
                            result.valid = false;
                        }
                    }
                }
            }
        }
        
        // Check for orphaned nodes
        const connectedNodes = new Set();
        for (const [sourceId, outputs] of Object.entries(workflow.connections || {})) {
            connectedNodes.add(sourceId);
            for (const outputType of Object.values(outputs)) {
                for (const connections of outputType) {
                    for (const conn of connections) {
                        connectedNodes.add(conn.node);
                    }
                }
            }
        }
        
        const orphanedNodes = Array.from(nodeIds).filter(id => !connectedNodes.has(id));
        if (orphanedNodes.length > 0) {
            result.warnings.push({
                type: 'orphaned-nodes',
                message: `Found ${orphanedNodes.length} unconnected nodes`,
                nodes: orphanedNodes
            });
        }
        
        return result;
    }

    async validateDataFlow(workflow) {
        console.log('  📊 Layer 4: Data flow validation...');
        
        const result = {
            layer: 'dataFlow',
            valid: true,
            errors: [],
            warnings: [],
            fixes: []
        };
        
        // Build data flow graph
        const graph = this.buildDataFlowGraph(workflow);
        
        // Check for cycles
        if (this.hasCycles(graph)) {
            result.warnings.push({
                type: 'cycle-detected',
                message: 'Workflow contains cycles, may cause infinite loops'
            });
        }
        
        // Check data compatibility between connected nodes
        for (const [sourceId, targets] of Object.entries(graph)) {
            const sourceNode = workflow.nodes.find(n => n.id === sourceId);
            if (!sourceNode) continue;
            
            for (const targetId of targets) {
                const targetNode = workflow.nodes.find(n => n.id === targetId);
                if (!targetNode) continue;
                
                // Check if data types are compatible
                const compatible = this.checkDataCompatibility(sourceNode, targetNode);
                if (!compatible) {
                    result.warnings.push({
                        type: 'data-compatibility',
                        message: `Data may not be compatible between ${sourceNode.name} and ${targetNode.name}`,
                        source: sourceId,
                        target: targetId
                    });
                }
            }
        }
        
        return result;
    }

    async validateSecurity(workflow) {
        console.log('  🔒 Layer 5: Security validation...');
        
        const result = {
            layer: 'security',
            valid: true,
            errors: [],
            warnings: [],
            fixes: []
        };
        
        // Check for exposed credentials
        const workflowString = JSON.stringify(workflow);
        const credentialPatterns = [
            /api[_-]?key/i,
            /secret/i,
            /password/i,
            /token/i,
            /credential/i
        ];
        
        for (const pattern of credentialPatterns) {
            if (pattern.test(workflowString)) {
                // Check if it's actually a value (not just a field name)
                const matches = workflowString.match(new RegExp(`"[^"]*${pattern.source}[^"]*"\\s*:\\s*"([^"]+)"`, 'gi'));
                if (matches) {
                    result.warnings.push({
                        type: 'exposed-credentials',
                        message: 'Potential exposed credentials detected',
                        pattern: pattern.source
                    });
                    
                    result.fixes.push({
                        fix: 'Use credential references instead of hardcoded values'
                    });
                }
            }
        }
        
        // Check for unsafe operations
        const codeNodes = workflow.nodes.filter(n => n.type.includes('code'));
        if (codeNodes.length > 0) {
            result.warnings.push({
                type: 'code-execution',
                message: 'Workflow contains code execution nodes, review for security'
            });
        }
        
        return result;
    }

    async validatePerformance(workflow) {
        console.log('  ⚡ Layer 6: Performance validation...');
        
        const result = {
            layer: 'performance',
            valid: true,
            errors: [],
            warnings: [],
            fixes: []
        };
        
        // Check workflow size
        if (workflow.nodes.length > 50) {
            result.warnings.push({
                type: 'large-workflow',
                message: 'Workflow contains many nodes, may impact performance',
                nodeCount: workflow.nodes.length
            });
        }
        
        // Check for expensive operations
        const expensiveNodes = workflow.nodes.filter(n => 
            n.type.includes('loop') || 
            n.type.includes('splitInBatches')
        );
        
        if (expensiveNodes.length > 0) {
            result.warnings.push({
                type: 'expensive-operations',
                message: 'Workflow contains potentially expensive operations',
                nodes: expensiveNodes.map(n => n.name)
            });
        }
        
        // Check for missing rate limiting
        const apiNodes = workflow.nodes.filter(n => 
            n.type.includes('http') || 
            n.type.includes('api') ||
            n.type.includes('openAi')
        );
        
        if (apiNodes.length > 3) {
            result.warnings.push({
                type: 'rate-limiting',
                message: 'Multiple API calls detected, consider adding rate limiting',
                apiNodeCount: apiNodes.length
            });
            
            result.fixes.push({
                fix: 'Add wait nodes between API calls'
            });
        }
        
        return result;
    }

    buildDataFlowGraph(workflow) {
        const graph = {};
        
        for (const [sourceId, outputs] of Object.entries(workflow.connections || {})) {
            graph[sourceId] = [];
            
            for (const outputType of Object.values(outputs)) {
                for (const connections of outputType) {
                    for (const conn of connections) {
                        graph[sourceId].push(conn.node);
                    }
                }
            }
        }
        
        return graph;
    }

    hasCycles(graph) {
        const visited = new Set();
        const recursionStack = new Set();
        
        const hasCycleDFS = (node) => {
            visited.add(node);
            recursionStack.add(node);
            
            const neighbors = graph[node] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (hasCycleDFS(neighbor)) {
                        return true;
                    }
                } else if (recursionStack.has(neighbor)) {
                    return true;
                }
            }
            
            recursionStack.delete(node);
            return false;
        };
        
        for (const node in graph) {
            if (!visited.has(node)) {
                if (hasCycleDFS(node)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    checkDataCompatibility(sourceNode, targetNode) {
        // Simple compatibility check based on node types
        const compatibilityMap = {
            'webhook': ['any'],
            'telegram': ['agent', 'postgres', 'code'],
            'agent': ['telegram', 'email', 'postgres'],
            'postgres': ['agent', 'merge', 'code'],
            'openWeatherMap': ['merge', 'agent', 'email'],
            'email': ['any']
        };
        
        const sourceType = sourceNode.type.split('.').pop();
        const targetType = targetNode.type.split('.').pop();
        
        const compatible = compatibilityMap[sourceType];
        if (!compatible) return true; // Unknown type, assume compatible
        
        return compatible.includes('any') || compatible.includes(targetType);
    }

    async healWorkflow(workflow, validationResults) {
        console.log('\n🔧 Attempting to heal workflow...');
        
        const healed = JSON.parse(JSON.stringify(workflow)); // Deep clone
        
        // Apply fixes
        for (const fix of validationResults.fixes) {
            if (fix.nodeId && fix.parameter) {
                const node = healed.nodes.find(n => n.id === fix.nodeId);
                if (node) {
                    if (!node.parameters) node.parameters = {};
                    node.parameters[fix.parameter] = fix.value;
                    console.log(`  ✓ Applied fix: ${fix.fix}`);
                }
            } else if (fix.path) {
                // Handle path-based fixes
                // This would need more sophisticated path handling
                console.log(`  ⚠️ Path-based fix not implemented: ${fix.fix}`);
            }
        }
        
        // Re-validate healed workflow
        const healedValidation = await this.validateWorkflow(healed);
        
        if (healedValidation.valid || healedValidation.errors.length < validationResults.errors.length) {
            console.log('✅ Workflow healing successful');
            return healed;
        } else {
            console.log('⚠️ Workflow healing partially successful');
            return healed;
        }
    }
}

// Export for use in main orchestrator
module.exports = ValidationGuardianAgent;

// Run if executed directly
if (require.main === module) {
    const agent = new ValidationGuardianAgent();
    
    const testWorkflow = {
        name: 'Test Workflow',
        nodes: [
            {
                id: 'webhook',
                name: 'Webhook',
                type: 'n8n-nodes-base.webhook',
                position: [250, 300],
                parameters: {
                    httpMethod: 'POST',
                    path: '/test'
                }
            }
        ],
        connections: {},
        active: false
    };
    
    agent.validateWorkflow(testWorkflow).then(results => {
        console.log('\n📊 Validation Results:');
        console.log(JSON.stringify(results, null, 2));
        
        if (!results.valid) {
            return agent.healWorkflow(testWorkflow, results);
        }
    }).then(healed => {
        if (healed) {
            console.log('\n🔧 Healed Workflow:');
            console.log(JSON.stringify(healed, null, 2));
        }
    }).catch(console.error);
}