#!/usr/bin/env node

/**
 * Node Research Agent
 * Deeply researches and analyzes n8n nodes using multiple data sources
 */

const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const { ApifyClient } = require('apify-client');
const path = require('path');

class NodeResearchAgent {
    constructor() {
        // Initialize Apify client with provided credentials
        this.apify = new ApifyClient({
            token: process.env.APIFY_API_TOKEN
        });
        
        this.prisma = null;
        this.db = null;
        this.nodeCache = new Map();
    }

    async initialize() {
        try {
            // Try Prisma first
            this.prisma = new PrismaClient();
            console.log('✅ Prisma client initialized');
        } catch (error) {
            console.log('⚠️ Prisma not available, using SQLite fallback');
            
            // Fallback to direct SQLite
            try {
                const dbPath = path.join(process.env.HOME, '.n8n', 'n8n-mcp.db');
                this.db = new Database(dbPath, { readonly: true });
            } catch (dbError) {
                console.log('⚠️ Local database not available');
            }
        }
    }

    async researchNodes(nodeNames) {
        console.log('\n🔬 Node Research Agent: Deep analysis starting...');
        
        const research = {
            nodes: [],
            documentation: [],
            examples: [],
            parameters: {},
            connections: {},
            bestPractices: []
        };
        
        for (const nodeName of nodeNames) {
            console.log(`\n  Researching: ${nodeName}`);
            
            // 1. Database lookup
            const dbInfo = await this.searchDatabase(nodeName);
            if (dbInfo) research.nodes.push(dbInfo);
            
            // 2. Apify scraping for documentation
            const docs = await this.scrapeDocumentation(nodeName);
            if (docs) research.documentation.push(docs);
            
            // 3. Find examples
            const examples = await this.findExamples(nodeName);
            research.examples.push(...examples);
            
            // 4. Analyze parameters
            const params = await this.analyzeParameters(nodeName);
            research.parameters[nodeName] = params;
            
            // 5. Study connections
            const connections = await this.studyConnections(nodeName);
            research.connections[nodeName] = connections;
        }
        
        // 6. Compile best practices
        research.bestPractices = this.compileBestPractices(research);
        
        console.log('\n✅ Node research complete');
        return research;
    }

    async searchDatabase(nodeName) {
        // Clean node name for search
        const searchTerm = nodeName.replace('n8n-nodes-base.', '').replace('n8n-nodes-langchain.', '');
        
        if (this.db) {
            try {
                const stmt = this.db.prepare(`
                    SELECT * FROM nodes 
                    WHERE name LIKE ? OR displayName LIKE ?
                    LIMIT 1
                `);
                
                const result = stmt.get(`%${searchTerm}%`, `%${searchTerm}%`);
                if (result) {
                    console.log(`    ✓ Found in database: ${result.displayName}`);
                    return result;
                }
            } catch (error) {
                console.log(`    ⚠️ Database search failed: ${error.message}`);
            }
        }
        
        // Fallback: return basic info
        return {
            name: nodeName,
            displayName: searchTerm,
            description: `Node for ${searchTerm} operations`
        };
    }

    async scrapeDocumentation(nodeName) {
        console.log(`    📚 Scraping documentation...`);
        
        const nodeSlug = nodeName.replace('n8n-nodes-base.', '').replace('n8n-nodes-langchain.', '').toLowerCase();
        const docUrl = `https://docs.n8n.io/integrations/builtin/app-nodes/${nodeName}/`;
        
        try {
            // Use Apify Web Scraper
            const run = await this.apify.actor('apify/web-scraper').call({
                startUrls: [{ url: docUrl }],
                maxPagesPerCrawl: 1,
                pageFunction: `
                    async function pageFunction(context) {
                        const { page, request } = context;
                        const title = await page.title();
                        
                        // Extract all text content
                        const content = await page.evaluate(() => {
                            return document.body.innerText;
                        });
                        
                        // Extract code examples
                        const codeExamples = await page.evaluate(() => {
                            const codes = [];
                            document.querySelectorAll('pre code').forEach(el => {
                                codes.push(el.textContent);
                            });
                            return codes;
                        });
                        
                        // Extract parameters
                        const parameters = await page.evaluate(() => {
                            const params = [];
                            document.querySelectorAll('h3').forEach(h3 => {
                                if (h3.textContent.toLowerCase().includes('parameter')) {
                                    const nextEl = h3.nextElementSibling;
                                    if (nextEl) {
                                        params.push({
                                            title: h3.textContent,
                                            content: nextEl.textContent
                                        });
                                    }
                                }
                            });
                            return params;
                        });
                        
                        return {
                            url: request.url,
                            title,
                            content: content.substring(0, 5000), // Limit content
                            codeExamples,
                            parameters
                        };
                    }
                `.trim(),
                waitUntil: 'networkidle2'
            });
            
            // Wait for run to finish
            const { items } = await this.apify.dataset(run.defaultDatasetId).listItems();
            
            if (items && items.length > 0) {
                console.log(`    ✓ Documentation scraped successfully`);
                return items[0];
            }
        } catch (error) {
            console.log(`    ⚠️ Apify scraping failed: ${error.message}`);
        }
        
        return null;
    }

    async findExamples(nodeName) {
        console.log(`    🔍 Finding examples...`);
        
        const examples = [];
        const searchTerm = nodeName.replace('n8n-nodes-base.', '').replace('n8n-nodes-langchain.', '');
        
        try {
            // Search n8n.io for workflows using this node
            const run = await this.apify.actor('apify/google-search-scraper').call({
                queries: [`site:n8n.io/workflows ${searchTerm}`],
                maxPagesPerQuery: 1,
                resultsPerPage: 5
            });
            
            const { items } = await this.apify.dataset(run.defaultDatasetId).listItems();
            
            if (items && items.length > 0) {
                items.forEach(item => {
                    if (item.organicResults) {
                        item.organicResults.forEach(result => {
                            examples.push({
                                title: result.title,
                                url: result.url,
                                description: result.description
                            });
                        });
                    }
                });
                
                console.log(`    ✓ Found ${examples.length} examples`);
            }
        } catch (error) {
            console.log(`    ⚠️ Example search failed: ${error.message}`);
        }
        
        return examples;
    }

    async analyzeParameters(nodeName) {
        console.log(`    ⚙️ Analyzing parameters...`);
        
        // Define common parameters for each node type
        const parameterMap = {
            'telegramTrigger': {
                required: ['credential'],
                optional: ['updates', 'additionalFields'],
                authentication: 'telegram-bot-token'
            },
            'telegram': {
                required: ['credential', 'chatId', 'text'],
                optional: ['replyMarkup', 'additionalFields'],
                authentication: 'telegram-bot-token'
            },
            'openWeatherMap': {
                required: ['credential', 'cityName'],
                optional: ['units', 'language'],
                authentication: 'api-key'
            },
            'postgres': {
                required: ['credential', 'operation'],
                optional: ['schema', 'table', 'columns'],
                authentication: 'connection-string'
            },
            'emailSend': {
                required: ['fromEmail', 'toEmail', 'subject'],
                optional: ['html', 'text', 'attachments'],
                authentication: 'smtp'
            },
            'httpRequest': {
                required: ['url', 'method'],
                optional: ['headers', 'queryParameters', 'body'],
                authentication: 'various'
            },
            'agent': {
                required: ['prompt'],
                optional: ['systemMessage', 'options'],
                tools: ['memory', 'calculator', 'code'],
                authentication: 'openai-api-key'
            },
            'openAi': {
                required: ['model', 'prompt'],
                optional: ['temperature', 'maxTokens'],
                authentication: 'api-key'
            },
            'scheduleTrigger': {
                required: ['rule'],
                optional: ['timezone'],
                authentication: 'none'
            }
        };
        
        const nodeKey = nodeName.split('.').pop();
        return parameterMap[nodeKey] || {
            required: [],
            optional: [],
            authentication: 'unknown'
        };
    }

    async studyConnections(nodeName) {
        console.log(`    🔗 Studying connections...`);
        
        const connections = {
            inputs: [],
            outputs: [],
            commonPairs: [],
            dataTransformation: []
        };
        
        // Define common connection patterns
        const connectionPatterns = {
            'telegramTrigger': {
                inputs: [],
                outputs: ['any'],
                commonPairs: ['telegram', 'agent', 'postgres'],
                dataTransformation: 'message-object'
            },
            'openWeatherMap': {
                inputs: ['trigger'],
                outputs: ['data'],
                commonPairs: ['merge', 'emailSend', 'postgres'],
                dataTransformation: 'weather-data'
            },
            'postgres': {
                inputs: ['any'],
                outputs: ['data'],
                commonPairs: ['agent', 'httpRequest'],
                dataTransformation: 'database-records'
            },
            'agent': {
                inputs: ['any'],
                outputs: ['response'],
                commonPairs: ['telegram', 'emailSend', 'postgres'],
                dataTransformation: 'ai-response'
            }
        };
        
        const nodeKey = nodeName.split('.').pop();
        return connectionPatterns[nodeKey] || connections;
    }

    compileBestPractices(research) {
        const practices = [];
        
        // Compile from documentation
        research.documentation.forEach(doc => {
            if (doc && doc.content) {
                if (doc.content.includes('best practice')) {
                    practices.push('Follow documented best practices');
                }
                if (doc.content.includes('rate limit')) {
                    practices.push('Implement rate limiting');
                }
                if (doc.content.includes('error')) {
                    practices.push('Add error handling');
                }
            }
        });
        
        // Add general best practices
        practices.push('Always validate inputs');
        practices.push('Use environment variables for credentials');
        practices.push('Implement retry logic for API calls');
        practices.push('Add logging for debugging');
        practices.push('Test with sample data first');
        
        return [...new Set(practices)]; // Remove duplicates
    }

    async cleanup() {
        if (this.prisma) {
            await this.prisma.$disconnect();
        }
        if (this.db) {
            this.db.close();
        }
    }
}

// Export for use in main orchestrator
module.exports = NodeResearchAgent;

// Run if executed directly
if (require.main === module) {
    const agent = new NodeResearchAgent();
    const testNodes = [
        'n8n-nodes-base.telegramTrigger',
        'n8n-nodes-langchain.agent',
        'n8n-nodes-base.openWeatherMap',
        'n8n-nodes-base.postgres'
    ];
    
    agent.initialize().then(() => {
        return agent.researchNodes(testNodes);
    }).then(research => {
        console.log('\n📊 Research Results:');
        console.log(JSON.stringify(research, null, 2));
        return agent.cleanup();
    }).catch(console.error);
}