#!/usr/bin/env node

/**
 * Intent Parser Agent
 * Deeply analyzes user requirements to extract workflow intent
 */

const natural = require('natural');
const { z } = require('zod');

// Intent schema
const IntentSchema = z.object({
    type: z.string(),
    description: z.string(),
    triggers: z.array(z.object({
        type: z.string(),
        source: z.string(),
        conditions: z.array(z.string()).optional()
    })),
    actions: z.array(z.object({
        type: z.string(),
        target: z.string(),
        parameters: z.record(z.any()).optional()
    })),
    dataFlow: z.array(z.object({
        from: z.string(),
        to: z.string(),
        transformation: z.string().optional()
    })),
    requirements: z.object({
        authentication: z.array(z.string()),
        dataStorage: z.array(z.string()),
        scheduling: z.boolean(),
        errorHandling: z.boolean(),
        rateLimit: z.boolean()
    }),
    nodes: z.array(z.string()),
    confidence: z.number()
});

class IntentParserAgent {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.classifier = new natural.BayesClassifier();
        this.patterns = this.loadPatterns();
    }

    loadPatterns() {
        return {
            triggers: {
                telegram: ['telegram', 'bot', 'message', 'chat', 'command'],
                webhook: ['webhook', 'http', 'api', 'endpoint', 'request'],
                schedule: ['schedule', 'cron', 'every', 'daily', 'morning', 'evening'],
                email: ['email', 'mail', 'inbox', 'message']
            },
            actions: {
                weather: ['weather', 'temperature', 'forecast', 'climate'],
                news: ['news', 'headlines', 'articles', 'latest'],
                events: ['events', 'happening', 'activities', 'calendar'],
                database: ['store', 'save', 'postgres', 'database', 'memory'],
                email: ['send', 'email', 'notify', 'mail'],
                ai: ['ai', 'llm', 'gpt', 'openai', 'agent', 'assistant']
            },
            dataFlow: {
                api: ['fetch', 'get', 'retrieve', 'pull', 'api'],
                transform: ['process', 'transform', 'convert', 'format'],
                aggregate: ['combine', 'merge', 'aggregate', 'collect'],
                filter: ['filter', 'if', 'condition', 'check']
            }
        };
    }

    async parseIntent(userRequest) {
        console.log('\n🧠 Intent Parser Agent: Analyzing request...');
        
        const tokens = this.tokenizer.tokenize(userRequest.toLowerCase());
        
        // Detect triggers
        const triggers = this.detectTriggers(userRequest, tokens);
        
        // Detect actions
        const actions = this.detectActions(userRequest, tokens);
        
        // Detect data flow
        const dataFlow = this.detectDataFlow(userRequest, tokens);
        
        // Detect requirements
        const requirements = this.detectRequirements(userRequest, tokens);
        
        // Determine workflow type
        const type = this.determineWorkflowType(triggers, actions);
        
        // Identify required nodes
        const nodes = this.identifyNodes(triggers, actions, requirements);
        
        // Calculate confidence
        const confidence = this.calculateConfidence(triggers, actions, nodes);
        
        const intent = {
            type,
            description: userRequest,
            triggers,
            actions,
            dataFlow,
            requirements,
            nodes,
            confidence
        };
        
        // Validate with Zod
        try {
            const validated = IntentSchema.parse(intent);
            console.log('✅ Intent parsed successfully with confidence:', validated.confidence);
            return validated;
        } catch (error) {
            console.log('⚠️ Intent validation failed, refining...');
            // Refine and retry
            intent.confidence = Math.max(0, intent.confidence - 0.2);
            return intent;
        }
    }

    detectTriggers(request, tokens) {
        const triggers = [];
        
        for (const [triggerType, keywords] of Object.entries(this.patterns.triggers)) {
            if (keywords.some(kw => tokens.includes(kw))) {
                triggers.push({
                    type: triggerType,
                    source: this.extractSource(request, triggerType),
                    conditions: this.extractConditions(request, triggerType)
                });
            }
        }
        
        // Default trigger if none found
        if (triggers.length === 0) {
            triggers.push({
                type: 'webhook',
                source: 'http'
            });
        }
        
        return triggers;
    }

    detectActions(request, tokens) {
        const actions = [];
        
        for (const [actionType, keywords] of Object.entries(this.patterns.actions)) {
            if (keywords.some(kw => tokens.includes(kw))) {
                actions.push({
                    type: actionType,
                    target: this.extractTarget(request, actionType),
                    parameters: this.extractParameters(request, actionType)
                });
            }
        }
        
        return actions;
    }

    detectDataFlow(request, tokens) {
        const flows = [];
        
        // Analyze sentence structure for data flow
        if (request.includes('from') && request.includes('to')) {
            const fromMatch = request.match(/from\s+(\w+)/i);
            const toMatch = request.match(/to\s+(\w+)/i);
            
            if (fromMatch && toMatch) {
                flows.push({
                    from: fromMatch[1],
                    to: toMatch[1],
                    transformation: 'direct'
                });
            }
        }
        
        // Detect implicit flows
        if (tokens.includes('weather') && tokens.includes('email')) {
            flows.push({
                from: 'weather-api',
                to: 'email',
                transformation: 'format'
            });
        }
        
        if (tokens.includes('telegram') && tokens.includes('database')) {
            flows.push({
                from: 'telegram',
                to: 'database',
                transformation: 'store'
            });
        }
        
        return flows;
    }

    detectRequirements(request, tokens) {
        return {
            authentication: this.detectAuth(tokens),
            dataStorage: this.detectStorage(tokens),
            scheduling: tokens.includes('every') || tokens.includes('morning') || tokens.includes('daily'),
            errorHandling: true, // Always include
            rateLimit: tokens.includes('telegram') || tokens.includes('api')
        };
    }

    detectAuth(tokens) {
        const auth = [];
        
        if (tokens.includes('telegram')) auth.push('telegram-bot-token');
        if (tokens.includes('weather')) auth.push('openweather-api-key');
        if (tokens.includes('news')) auth.push('news-api-key');
        if (tokens.includes('email')) auth.push('smtp-credentials');
        if (tokens.includes('openai') || tokens.includes('gpt')) auth.push('openai-api-key');
        
        return auth;
    }

    detectStorage(tokens) {
        const storage = [];
        
        if (tokens.includes('postgres') || tokens.includes('memory')) {
            storage.push('postgresql');
        }
        if (tokens.includes('store') || tokens.includes('save')) {
            storage.push('database');
        }
        
        return storage;
    }

    determineWorkflowType(triggers, actions) {
        if (triggers.some(t => t.type === 'telegram')) {
            return 'Telegram Bot Workflow';
        }
        if (actions.some(a => a.type === 'ai')) {
            return 'AI Agent Workflow';
        }
        if (triggers.some(t => t.type === 'schedule')) {
            return 'Scheduled Automation';
        }
        
        return 'General Automation';
    }

    identifyNodes(triggers, actions, requirements) {
        const nodes = new Set();
        
        // Add trigger nodes
        triggers.forEach(t => {
            switch(t.type) {
                case 'telegram':
                    nodes.add('n8n-nodes-base.telegramTrigger');
                    break;
                case 'webhook':
                    nodes.add('n8n-nodes-base.webhook');
                    break;
                case 'schedule':
                    nodes.add('n8n-nodes-base.scheduleTrigger');
                    break;
            }
        });
        
        // Add action nodes
        actions.forEach(a => {
            switch(a.type) {
                case 'weather':
                    nodes.add('n8n-nodes-base.openWeatherMap');
                    break;
                case 'news':
                    nodes.add('n8n-nodes-base.rssFeedRead');
                    nodes.add('n8n-nodes-base.httpRequest');
                    break;
                case 'events':
                    nodes.add('n8n-nodes-base.googleCalendar');
                    nodes.add('n8n-nodes-base.httpRequest');
                    break;
                case 'database':
                    nodes.add('n8n-nodes-base.postgres');
                    break;
                case 'email':
                    nodes.add('n8n-nodes-base.emailSend');
                    break;
                case 'ai':
                    nodes.add('n8n-nodes-langchain.agent');
                    nodes.add('n8n-nodes-langchain.openAi');
                    break;
            }
        });
        
        // Add utility nodes
        if (actions.length > 2) {
            nodes.add('n8n-nodes-base.merge');
        }
        if (requirements.errorHandling) {
            nodes.add('n8n-nodes-base.errorTrigger');
        }
        
        return Array.from(nodes);
    }

    calculateConfidence(triggers, actions, nodes) {
        let confidence = 0.5; // Base confidence
        
        // Increase confidence based on clarity
        if (triggers.length > 0) confidence += 0.15;
        if (actions.length > 0) confidence += 0.15;
        if (nodes.length > 3) confidence += 0.1;
        if (actions.some(a => a.parameters && Object.keys(a.parameters).length > 0)) confidence += 0.1;
        
        return Math.min(1, confidence);
    }

    extractSource(request, triggerType) {
        switch(triggerType) {
            case 'telegram':
                return 'telegram-bot';
            case 'email':
                const emailMatch = request.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                return emailMatch ? emailMatch[1] : 'email';
            default:
                return triggerType;
        }
    }

    extractTarget(request, actionType) {
        switch(actionType) {
            case 'email':
                const emailMatch = request.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                return emailMatch ? emailMatch[1] : 'user@example.com';
            case 'weather':
                const locationMatch = request.match(/(?:from|in|at)\s+([A-Za-z\s]+?)(?:\s+and|\s+,|$)/i);
                return locationMatch ? locationMatch[1].trim() : 'location';
            default:
                return actionType;
        }
    }

    extractParameters(request, actionType) {
        const params = {};
        
        switch(actionType) {
            case 'weather':
                const locationMatch = request.match(/(?:from|in|at)\s+([A-Za-z\s,]+?)(?:\s+and|\s+top|$)/i);
                if (locationMatch) {
                    params.location = locationMatch[1].trim();
                }
                break;
            case 'schedule':
                if (request.includes('morning')) params.time = '08:00';
                if (request.includes('evening')) params.time = '18:00';
                if (request.includes('daily')) params.frequency = 'daily';
                break;
        }
        
        return Object.keys(params).length > 0 ? params : undefined;
    }

    extractConditions(request, triggerType) {
        const conditions = [];
        
        if (request.includes('if')) {
            const ifMatch = request.match(/if\s+(.+?)(?:\s+then|,|$)/i);
            if (ifMatch) {
                conditions.push(ifMatch[1]);
            }
        }
        
        return conditions.length > 0 ? conditions : undefined;
    }
}

// Export for use in main orchestrator
module.exports = IntentParserAgent;

// Run if executed directly
if (require.main === module) {
    const agent = new IntentParserAgent();
    const testRequest = process.argv.slice(2).join(' ') || 
        "From the telegram chat if user says send me the weather from Everett MA and top news in Everett, and top events in Everett happening today, send it every morning on my email jimkalinov@gmail.com";
    
    agent.parseIntent(testRequest).then(intent => {
        console.log('\n📋 Parsed Intent:');
        console.log(JSON.stringify(intent, null, 2));
    });
}