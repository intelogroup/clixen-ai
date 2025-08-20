#!/usr/bin/env node

/**
 * Template Analyzer Agent
 * Analyzes existing n8n workflows to extract patterns and best practices
 */

const Firecrawl = require('@mendable/firecrawl-js').default;
const { z } = require('zod');
const got = require('got');

// Template analysis schema
const TemplateAnalysisSchema = z.object({
    source: z.string(),
    workflowName: z.string(),
    nodes: z.array(z.object({
        type: z.string(),
        position: z.number(),
        parameters: z.record(z.any()).optional()
    })),
    connections: z.array(z.object({
        from: z.string(),
        to: z.string(),
        type: z.string()
    })),
    patterns: z.array(z.string()),
    errorHandling: z.boolean(),
    authentication: z.array(z.string()),
    complexity: z.enum(['simple', 'medium', 'complex']),
    confidence: z.number()
});

class TemplateAnalyzerAgent {
    constructor() {
        this.firecrawl = new Firecrawl({ 
            apiKey: process.env.FIRECRAWL_API_KEY
        });
        this.templates = [];
        this.patterns = new Map();
    }

    async analyzeTemplates(workflowType, requiredNodes) {
        console.log('\n🔍 Template Analyzer Agent: Searching for templates...');
        
        // 1. Fetch templates from multiple sources
        const templates = await this.fetchTemplates(workflowType);
        
        // 2. Analyze each template
        const analyses = [];
        for (const template of templates) {
            const analysis = await this.analyzeTemplate(template, requiredNodes);
            if (analysis) {
                analyses.push(analysis);
            }
        }
        
        // 3. Extract common patterns
        const commonPatterns = this.extractCommonPatterns(analyses);
        
        // 4. Identify best practices
        const bestPractices = this.identifyBestPractices(analyses);
        
        // 5. Create recommendation
        const recommendation = this.createRecommendation(analyses, commonPatterns, bestPractices);
        
        console.log(`\n✅ Analyzed ${analyses.length} templates`);
        
        return {
            templates: analyses,
            commonPatterns,
            bestPractices,
            recommendation
        };
    }

    async fetchTemplates(workflowType) {
        console.log(`  📥 Fetching templates for: ${workflowType}`);
        
        const templates = [];
        const searchQueries = this.buildSearchQueries(workflowType);
        
        for (const query of searchQueries) {
            try {
                // Use Firecrawl to search n8n.io
                const searchUrl = `https://n8n.io/workflows?search=${encodeURIComponent(query)}`;
                console.log(`    Searching: ${searchUrl}`);
                
                const result = await this.firecrawl.scrape(searchUrl, {
                    formats: ['markdown'],
                    waitFor: 3000
                });
                
                if (result && result.markdown) {
                    // Extract workflow URLs from the markdown
                    const urls = this.extractWorkflowUrls(result.markdown);
                    
                    // Fetch each workflow
                    for (const url of urls.slice(0, 3)) { // Limit to 3 per query
                        const workflow = await this.fetchWorkflow(url);
                        if (workflow) {
                            templates.push(workflow);
                        }
                    }
                }
            } catch (error) {
                console.log(`    ⚠️ Failed to fetch templates for query "${query}": ${error.message}`);
            }
        }
        
        // Also try direct API if available
        try {
            const apiTemplates = await this.fetchFromAPI(workflowType);
            templates.push(...apiTemplates);
        } catch (error) {
            console.log(`    ⚠️ API fetch failed: ${error.message}`);
        }
        
        console.log(`  ✓ Found ${templates.length} templates`);
        return templates;
    }

    buildSearchQueries(workflowType) {
        const queries = [];
        
        if (workflowType.toLowerCase().includes('telegram')) {
            queries.push('telegram bot', 'telegram automation', 'telegram ai');
        }
        if (workflowType.toLowerCase().includes('ai')) {
            queries.push('ai agent', 'chatgpt', 'openai assistant');
        }
        if (workflowType.toLowerCase().includes('weather')) {
            queries.push('weather api', 'openweather', 'weather notification');
        }
        if (workflowType.toLowerCase().includes('schedule')) {
            queries.push('scheduled workflow', 'cron job', 'daily automation');
        }
        
        // Add generic query
        queries.push(workflowType);
        
        return queries;
    }

    extractWorkflowUrls(markdown) {
        const urls = [];
        const urlRegex = /https:\/\/n8n\.io\/workflows\/\d+/g;
        const matches = markdown.match(urlRegex);
        
        if (matches) {
            urls.push(...new Set(matches)); // Remove duplicates
        }
        
        return urls;
    }

    async fetchWorkflow(url) {
        try {
            console.log(`      Fetching workflow: ${url}`);
            
            const result = await this.firecrawl.scrape(url, {
                formats: ['markdown', 'html'],
                waitFor: 3000
            });
            
            if (result) {
                return {
                    url,
                    markdown: result.markdown,
                    html: result.html,
                    metadata: result.metadata
                };
            }
        } catch (error) {
            console.log(`      ⚠️ Failed to fetch workflow: ${error.message}`);
        }
        
        return null;
    }

    async fetchFromAPI(workflowType) {
        const templates = [];
        
        try {
            // Try n8n templates API (if available)
            const response = await got('https://api.n8n.io/api/templates', {
                searchParams: {
                    search: workflowType,
                    limit: 5
                },
                responseType: 'json',
                timeout: { request: 10000 }
            });
            
            if (response.body && response.body.workflows) {
                templates.push(...response.body.workflows);
            }
        } catch (error) {
            // API might not be public, that's okay
        }
        
        return templates;
    }

    async analyzeTemplate(template, requiredNodes) {
        try {
            const analysis = {
                source: template.url || 'api',
                workflowName: this.extractWorkflowName(template),
                nodes: this.extractNodes(template),
                connections: this.extractConnections(template),
                patterns: this.identifyPatterns(template),
                errorHandling: this.hasErrorHandling(template),
                authentication: this.extractAuthentication(template),
                complexity: this.calculateComplexity(template),
                confidence: 0.5
            };
            
            // Calculate confidence based on match with requirements
            if (requiredNodes) {
                const matchCount = requiredNodes.filter(rn => 
                    analysis.nodes.some(n => n.type.includes(rn))
                ).length;
                analysis.confidence = matchCount / requiredNodes.length;
            }
            
            // Validate with schema
            return TemplateAnalysisSchema.parse(analysis);
        } catch (error) {
            console.log(`    ⚠️ Template analysis failed: ${error.message}`);
            return null;
        }
    }

    extractWorkflowName(template) {
        if (template.metadata && template.metadata.title) {
            return template.metadata.title;
        }
        
        if (template.markdown) {
            const match = template.markdown.match(/^#\s+(.+)$/m);
            if (match) return match[1];
        }
        
        return 'Unknown Workflow';
    }

    extractNodes(template) {
        const nodes = [];
        
        if (template.markdown) {
            // Look for node mentions
            const nodeRegex = /n8n-nodes-[a-z.-]+/g;
            const matches = template.markdown.match(nodeRegex);
            
            if (matches) {
                matches.forEach((match, index) => {
                    nodes.push({
                        type: match,
                        position: index,
                        parameters: {}
                    });
                });
            }
            
            // Also look for common node names
            const commonNodes = [
                'Webhook', 'Telegram', 'OpenAI', 'Postgres', 'Email',
                'HTTP Request', 'Schedule', 'Merge', 'IF', 'Code'
            ];
            
            commonNodes.forEach((nodeName, index) => {
                if (template.markdown.includes(nodeName)) {
                    nodes.push({
                        type: nodeName.toLowerCase().replace(' ', '-'),
                        position: nodes.length + index,
                        parameters: {}
                    });
                }
            });
        }
        
        // Remove duplicates
        const uniqueNodes = [];
        const seen = new Set();
        for (const node of nodes) {
            if (!seen.has(node.type)) {
                uniqueNodes.push(node);
                seen.add(node.type);
            }
        }
        
        return uniqueNodes;
    }

    extractConnections(template) {
        const connections = [];
        
        if (template.markdown) {
            // Look for connection patterns
            const connectionPatterns = [
                /(\w+)\s*->\s*(\w+)/g,
                /(\w+)\s+to\s+(\w+)/gi,
                /from\s+(\w+)\s+to\s+(\w+)/gi,
                /connects?\s+(\w+)\s+(?:to|with)\s+(\w+)/gi
            ];
            
            connectionPatterns.forEach(pattern => {
                const matches = [...template.markdown.matchAll(pattern)];
                matches.forEach(match => {
                    if (match[1] && match[2]) {
                        connections.push({
                            from: match[1].toLowerCase(),
                            to: match[2].toLowerCase(),
                            type: 'main'
                        });
                    }
                });
            });
        }
        
        return connections;
    }

    identifyPatterns(template) {
        const patterns = [];
        
        if (template.markdown) {
            const content = template.markdown.toLowerCase();
            
            // Check for common patterns
            if (content.includes('webhook') && content.includes('trigger')) {
                patterns.push('webhook-trigger');
            }
            if (content.includes('schedule') || content.includes('cron')) {
                patterns.push('scheduled-execution');
            }
            if (content.includes('error') && content.includes('handling')) {
                patterns.push('error-handling');
            }
            if (content.includes('loop') || content.includes('iterate')) {
                patterns.push('loop-processing');
            }
            if (content.includes('condition') || content.includes('if')) {
                patterns.push('conditional-logic');
            }
            if (content.includes('merge') || content.includes('combine')) {
                patterns.push('data-merging');
            }
            if (content.includes('ai') || content.includes('llm') || content.includes('gpt')) {
                patterns.push('ai-integration');
            }
            if (content.includes('database') || content.includes('postgres') || content.includes('mysql')) {
                patterns.push('database-operations');
            }
        }
        
        return patterns;
    }

    hasErrorHandling(template) {
        if (template.markdown) {
            const content = template.markdown.toLowerCase();
            return content.includes('error') && 
                   (content.includes('catch') || content.includes('handle') || content.includes('retry'));
        }
        return false;
    }

    extractAuthentication(template) {
        const auth = [];
        
        if (template.markdown) {
            const content = template.markdown.toLowerCase();
            
            if (content.includes('api key') || content.includes('apikey')) {
                auth.push('api-key');
            }
            if (content.includes('oauth')) {
                auth.push('oauth2');
            }
            if (content.includes('token')) {
                auth.push('token');
            }
            if (content.includes('credential')) {
                auth.push('credentials');
            }
        }
        
        return auth;
    }

    calculateComplexity(template) {
        const nodeCount = this.extractNodes(template).length;
        const hasConditionals = template.markdown && template.markdown.toLowerCase().includes('if');
        const hasLoops = template.markdown && template.markdown.toLowerCase().includes('loop');
        
        if (nodeCount > 10 || (hasConditionals && hasLoops)) {
            return 'complex';
        } else if (nodeCount > 5 || hasConditionals || hasLoops) {
            return 'medium';
        } else {
            return 'simple';
        }
    }

    extractCommonPatterns(analyses) {
        const patternCounts = {};
        
        analyses.forEach(analysis => {
            analysis.patterns.forEach(pattern => {
                patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
            });
        });
        
        // Sort by frequency
        const sortedPatterns = Object.entries(patternCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([pattern, count]) => ({
                pattern,
                frequency: count / analyses.length
            }));
        
        return sortedPatterns;
    }

    identifyBestPractices(analyses) {
        const practices = [];
        
        // Check what most templates do
        const errorHandlingCount = analyses.filter(a => a.errorHandling).length;
        if (errorHandlingCount > analyses.length / 2) {
            practices.push('Always implement error handling');
        }
        
        // Check authentication patterns
        const authMethods = new Set();
        analyses.forEach(a => a.authentication.forEach(auth => authMethods.add(auth)));
        if (authMethods.size > 0) {
            practices.push(`Use proper authentication: ${Array.from(authMethods).join(', ')}`);
        }
        
        // Check complexity
        const simpleCount = analyses.filter(a => a.complexity === 'simple').length;
        if (simpleCount > analyses.length / 2) {
            practices.push('Keep workflows simple and focused');
        }
        
        // Add general best practices based on patterns
        const commonPatterns = this.extractCommonPatterns(analyses);
        commonPatterns.forEach(({ pattern, frequency }) => {
            if (frequency > 0.5) {
                practices.push(`Common pattern: ${pattern.replace('-', ' ')}`);
            }
        });
        
        return practices;
    }

    createRecommendation(analyses, commonPatterns, bestPractices) {
        // Find the best matching template
        const bestTemplate = analyses.reduce((best, current) => {
            return current.confidence > (best?.confidence || 0) ? current : best;
        }, null);
        
        return {
            recommendedTemplate: bestTemplate,
            suggestedPatterns: commonPatterns.filter(p => p.frequency > 0.3),
            bestPractices,
            confidence: bestTemplate ? bestTemplate.confidence : 0
        };
    }
}

// Export for use in main orchestrator
module.exports = TemplateAnalyzerAgent;

// Run if executed directly
if (require.main === module) {
    const agent = new TemplateAnalyzerAgent();
    const testType = 'Telegram AI Bot';
    const testNodes = ['telegram', 'ai-agent', 'postgres'];
    
    agent.analyzeTemplates(testType, testNodes).then(result => {
        console.log('\n📊 Template Analysis Results:');
        console.log(JSON.stringify(result, null, 2));
    }).catch(console.error);
}