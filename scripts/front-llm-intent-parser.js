#!/usr/bin/env node

/**
 * Front LLM Intent Parser - The Conversation Guard
 * Routes user requests to appropriate workflows
 */

const fs = require('fs').promises;

// Service catalog with intent mapping
const SERVICE_CATALOG = {
    document_analytics: {
        keywords: ['analyze', 'document', 'pdf', 'excel', 'csv', 'statistics', 'report', 'insights', 'data'],
        examples: [
            "Analyze this PDF document",
            "Generate statistics from my Excel file",
            "Create a report from this CSV",
            "What insights can you find in this document?"
        ],
        workflow: 'document-analytics',
        requirements: ['file_url', 'file_type'],
        response: "I'll analyze your document and provide statistics, insights, and visualizations."
    },
    
    task_scheduling: {
        keywords: ['schedule', 'reminder', 'task', 'calendar', 'recurring', 'notification', 'alert'],
        examples: [
            "Schedule a reminder for tomorrow",
            "Set up a recurring task",
            "Remind me every Monday",
            "Schedule an email for next week"
        ],
        workflow: 'task-scheduler',
        requirements: ['task_description', 'schedule_time'],
        response: "I'll set up your scheduled task or reminder."
    },
    
    api_automation: {
        keywords: ['api', 'integrate', 'automate', 'connect', 'sync', 'webhook', 'zapier'],
        examples: [
            "Connect my Google Sheets to Slack",
            "Automate data sync between systems",
            "Set up API integration",
            "Create webhook automation"
        ],
        workflow: 'api-automation',
        requirements: ['source_service', 'target_service', 'action'],
        response: "I'll set up the API automation between your services."
    },
    
    marketing_automation: {
        keywords: ['email', 'campaign', 'newsletter', 'marketing', 'broadcast', 'subscribers'],
        examples: [
            "Send newsletter to subscribers",
            "Create email campaign",
            "Schedule marketing emails",
            "Set up drip campaign"
        ],
        workflow: 'marketing-automation',
        requirements: ['recipient_list', 'email_content'],
        response: "I'll help you set up your marketing campaign."
    },
    
    data_transformation: {
        keywords: ['transform', 'convert', 'format', 'merge', 'clean', 'process', 'etl'],
        examples: [
            "Convert CSV to JSON",
            "Merge multiple Excel files",
            "Clean and format data",
            "Transform data structure"
        ],
        workflow: 'data-transformation',
        requirements: ['input_data', 'transformation_type'],
        response: "I'll transform your data according to your specifications."
    }
};

/**
 * Intent Parser Class
 */
class IntentParser {
    constructor() {
        this.minConfidence = 0.7;
        this.conversationContext = new Map();
    }
    
    /**
     * Parse user message and extract intent
     */
    parseIntent(message, userId) {
        const lowerMessage = message.toLowerCase();
        const words = lowerMessage.split(/\s+/);
        
        // Check for non-actionable messages
        if (this.isNonActionable(message)) {
            return {
                intent: 'conversation',
                confidence: 1.0,
                response: this.getConversationalResponse(message),
                actionable: false
            };
        }
        
        // Score each service based on keyword matches
        const scores = {};
        let maxScore = 0;
        let bestMatch = null;
        
        for (const [service, config] of Object.entries(SERVICE_CATALOG)) {
            let score = 0;
            
            // Check keyword matches
            for (const keyword of config.keywords) {
                if (lowerMessage.includes(keyword)) {
                    score += 1;
                }
            }
            
            // Check for example similarity
            for (const example of config.examples) {
                const similarity = this.calculateSimilarity(lowerMessage, example.toLowerCase());
                score += similarity;
            }
            
            scores[service] = score;
            if (score > maxScore) {
                maxScore = score;
                bestMatch = service;
            }
        }
        
        // Calculate confidence
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        const confidence = totalScore > 0 ? maxScore / totalScore : 0;
        
        // If confidence is too low, ask for clarification
        if (confidence < this.minConfidence || !bestMatch) {
            return {
                intent: 'clarification_needed',
                confidence: confidence,
                response: this.getClarificationResponse(),
                suggestions: this.getSuggestions(scores),
                actionable: false
            };
        }
        
        // Extract entities from message
        const entities = this.extractEntities(message, SERVICE_CATALOG[bestMatch]);
        
        // Check if all requirements are met
        const missingRequirements = this.checkRequirements(
            entities,
            SERVICE_CATALOG[bestMatch].requirements
        );
        
        if (missingRequirements.length > 0) {
            return {
                intent: bestMatch,
                confidence: confidence,
                response: this.getMissingRequirementsResponse(bestMatch, missingRequirements),
                missing: missingRequirements,
                actionable: false
            };
        }
        
        // Update conversation context
        this.updateContext(userId, bestMatch, entities);
        
        return {
            intent: bestMatch,
            confidence: confidence,
            workflow: SERVICE_CATALOG[bestMatch].workflow,
            entities: entities,
            response: SERVICE_CATALOG[bestMatch].response,
            actionable: true
        };
    }
    
    /**
     * Check if message is non-actionable
     */
    isNonActionable(message) {
        const nonActionable = [
            /^(hi|hello|hey|greetings?)$/i,
            /^(thanks|thank you|thx)$/i,
            /^(bye|goodbye|see you)$/i,
            /^(ok|okay|sure|yes|no)$/i,
            /^(help|what can you do)$/i
        ];
        
        return nonActionable.some(pattern => pattern.test(message.trim()));
    }
    
    /**
     * Calculate similarity between two strings
     */
    calculateSimilarity(str1, str2) {
        const words1 = new Set(str1.split(/\s+/));
        const words2 = new Set(str2.split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }
    
    /**
     * Extract entities from message
     */
    extractEntities(message, serviceConfig) {
        const entities = {};
        
        // Extract URLs
        const urlMatch = message.match(/https?:\/\/[^\s]+/gi);
        if (urlMatch) {
            entities.file_url = urlMatch[0];
        }
        
        // Extract file types
        const fileTypeMatch = message.match(/\.(pdf|csv|xlsx?|docx?|txt)/gi);
        if (fileTypeMatch) {
            entities.file_type = fileTypeMatch[0].substring(1);
        }
        
        // Extract dates/times
        const timeMatch = message.match(/(\d{1,2}:\d{2})|tomorrow|next\s+\w+|every\s+\w+/gi);
        if (timeMatch) {
            entities.schedule_time = timeMatch[0];
        }
        
        // Extract email addresses
        const emailMatch = message.match(/[^\s]+@[^\s]+\.[^\s]+/gi);
        if (emailMatch) {
            entities.email = emailMatch[0];
        }
        
        return entities;
    }
    
    /**
     * Check missing requirements
     */
    checkRequirements(entities, requirements) {
        return requirements.filter(req => !entities[req]);
    }
    
    /**
     * Update conversation context
     */
    updateContext(userId, intent, entities) {
        if (!this.conversationContext.has(userId)) {
            this.conversationContext.set(userId, {
                history: [],
                lastIntent: null,
                entities: {}
            });
        }
        
        const context = this.conversationContext.get(userId);
        context.history.push({
            intent: intent,
            timestamp: new Date(),
            entities: entities
        });
        context.lastIntent = intent;
        context.entities = { ...context.entities, ...entities };
        
        // Keep only last 10 interactions
        if (context.history.length > 10) {
            context.history.shift();
        }
    }
    
    /**
     * Get conversational response
     */
    getConversationalResponse(message) {
        const responses = {
            'hi': "Hello! I can help you with document analysis, task scheduling, API automation, and more. What would you like to do today?",
            'hello': "Hi there! I'm your automation assistant. I can analyze documents, schedule tasks, or set up integrations. How can I help?",
            'help': this.getHelpMessage(),
            'thanks': "You're welcome! Is there anything else I can help you with?",
            'bye': "Goodbye! Feel free to come back anytime you need automation help."
        };
        
        const key = message.toLowerCase().trim();
        return responses[key] || responses['help'];
    }
    
    /**
     * Get help message
     */
    getHelpMessage() {
        const services = Object.entries(SERVICE_CATALOG)
            .map(([key, config]) => `• ${key.replace(/_/g, ' ').toUpperCase()}: ${config.examples[0]}`)
            .join('\n');
        
        return `I can help you with:\n\n${services}\n\nJust tell me what you'd like to do!`;
    }
    
    /**
     * Get clarification response
     */
    getClarificationResponse() {
        return "I'm not sure what you'd like to do. Could you provide more details? " +
               "For example, you could say 'Analyze my PDF document' or 'Schedule a reminder for tomorrow'.";
    }
    
    /**
     * Get suggestions based on scores
     */
    getSuggestions(scores) {
        return Object.entries(scores)
            .filter(([_, score]) => score > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([service]) => ({
                service: service,
                example: SERVICE_CATALOG[service].examples[0]
            }));
    }
    
    /**
     * Get missing requirements response
     */
    getMissingRequirementsResponse(intent, missing) {
        const service = intent.replace(/_/g, ' ');
        const missingList = missing.map(m => m.replace(/_/g, ' ')).join(', ');
        
        return `I understand you want to use ${service}, but I need more information. ` +
               `Please provide: ${missingList}`;
    }
}

/**
 * Create Front LLM workflow for n8n
 */
async function createFrontLLMWorkflow() {
    const workflow = {
        name: "Front LLM Intent Router",
        nodes: [
            {
                parameters: {
                    path: "/chat",
                    method: "POST",
                    responseMode: "responseNode",
                    options: {}
                },
                id: "webhook-chat",
                name: "Chat Webhook",
                type: "n8n-nodes-base.webhook",
                typeVersion: 1.1,
                position: [250, 300]
            },
            {
                parameters: {
                    jsCode: `// Parse user intent
const parser = ${IntentParser.toString()};
const intentParser = new parser();

const message = $input.first().json.message;
const userId = $input.first().json.user_id || 'anonymous';

const result = intentParser.parseIntent(message, userId);

return {
    ...result,
    user_id: userId,
    message: message,
    timestamp: new Date().toISOString()
};`
                },
                id: "parse-intent",
                name: "Parse Intent",
                type: "n8n-nodes-base.code",
                typeVersion: 2,
                position: [450, 300]
            },
            {
                parameters: {
                    conditions: {
                        options: {
                            caseSensitive: false,
                            leftValue: "",
                            typeValidation: "strict"
                        },
                        conditions: [
                            {
                                leftValue: "={{ $json.actionable }}",
                                rightValue: true,
                                operator: {
                                    type: "boolean",
                                    operation: "true"
                                }
                            }
                        ],
                        combinator: "and"
                    },
                    options: {}
                },
                id: "check-actionable",
                name: "Is Actionable?",
                type: "n8n-nodes-base.if",
                typeVersion: 2,
                position: [650, 300]
            },
            {
                parameters: {
                    method: "POST",
                    url: "={{ 'http://localhost:5678/webhook/' + $json.workflow }}",
                    sendBody: true,
                    bodyParameters: {
                        parameters: [
                            {
                                name: "user_id",
                                value: "={{ $json.user_id }}"
                            },
                            {
                                name: "intent",
                                value: "={{ $json.intent }}"
                            },
                            {
                                name: "entities",
                                value: "={{ $json.entities }}"
                            }
                        ]
                    },
                    options: {}
                },
                id: "execute-workflow",
                name: "Execute Workflow",
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.1,
                position: [850, 200]
            },
            {
                parameters: {
                    respondWith: "json",
                    responseBody: {
                        json: {
                            success: "={{ $json.actionable }}",
                            response: "={{ $json.response }}",
                            intent: "={{ $json.intent }}",
                            confidence: "={{ $json.confidence }}",
                            suggestions: "={{ $json.suggestions }}",
                            workflow_triggered: "={{ $json.actionable ? $json.workflow : null }}"
                        }
                    },
                    options: {}
                },
                id: "respond",
                name: "Respond to User",
                type: "n8n-nodes-base.respondToWebhook",
                typeVersion: 1,
                position: [1050, 300]
            }
        ],
        connections: {
            "Chat Webhook": {
                "main": [[{ "node": "Parse Intent", "type": "main", "index": 0 }]]
            },
            "Parse Intent": {
                "main": [[{ "node": "Is Actionable?", "type": "main", "index": 0 }]]
            },
            "Is Actionable?": {
                "main": [
                    [{ "node": "Execute Workflow", "type": "main", "index": 0 }],
                    [{ "node": "Respond to User", "type": "main", "index": 0 }]
                ]
            },
            "Execute Workflow": {
                "main": [[{ "node": "Respond to User", "type": "main", "index": 0 }]]
            }
        }
    };
    
    await fs.writeFile(
        './workflows/front-llm-router.json',
        JSON.stringify(workflow, null, 2)
    );
    
    console.log('✅ Front LLM Router workflow created');
    return workflow;
}

/**
 * Test the intent parser
 */
async function testIntentParser() {
    const parser = new IntentParser();
    
    const testCases = [
        "Analyze my PDF document at https://example.com/report.pdf",
        "Schedule a reminder for tomorrow at 3pm",
        "Hi",
        "Connect my Google Sheets to Slack",
        "Send newsletter to all subscribers",
        "Transform this CSV data to JSON format",
        "What can you do?",
        "I need help with something"
    ];
    
    console.log('\n🧪 Testing Intent Parser:\n');
    
    for (const testCase of testCases) {
        const result = parser.parseIntent(testCase, 'test-user');
        console.log(`Input: "${testCase}"`);
        console.log(`Intent: ${result.intent}`);
        console.log(`Actionable: ${result.actionable}`);
        console.log(`Response: ${result.response}`);
        console.log('-'.repeat(60));
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 FRONT LLM INTENT PARSER');
    console.log('='.repeat(60));
    
    // Test parser
    await testIntentParser();
    
    // Create workflow
    await createFrontLLMWorkflow();
    
    console.log('\n✅ Front LLM setup complete!');
    console.log('\n📚 Integration Points:');
    console.log('• Webhook endpoint: /chat');
    console.log('• Connects to: document-analytics, task-scheduler, etc.');
    console.log('• Filters non-actionable messages');
    console.log('• Provides helpful suggestions');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { IntentParser, SERVICE_CATALOG };