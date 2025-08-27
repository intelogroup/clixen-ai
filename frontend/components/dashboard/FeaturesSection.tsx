'use client';

// Client-side features section for better performance
import { memo } from 'react';
import Link from 'next/link';

const features = [
  {
    emoji: '🌤️',
    title: 'Weather Updates',
    description: 'Get current weather for any city'
  },
  {
    emoji: '📧', 
    title: 'Email Scanner',
    description: 'Scan inbox for invoices and spending'
  },
  {
    emoji: '🌍',
    title: 'Text Translation', 
    description: 'Translate between languages'
  },
  {
    emoji: '📄',
    title: 'PDF Summarizer',
    description: 'AI-powered document summaries'
  }
];

const FeatureItem = memo(({ feature }: { feature: typeof features[0] }) => (
  <div className="flex items-start">
    <span className="text-2xl mr-3" role="img">{feature.emoji}</span>
    <div>
      <h4 className="font-medium text-gray-900">{feature.title}</h4>
      <p className="text-sm text-gray-500">{feature.description}</p>
    </div>
  </div>
));

const FeaturesSection = memo(() => (
  <div className="mt-8">
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Available Features
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Use these automation features through @clixen_bot on Telegram
        </p>
      </div>
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <FeatureItem key={index} feature={feature} />
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Message <Link href="https://t.me/clixen_bot" target="_blank" className="text-indigo-600 hover:text-indigo-800 transition-colors">@clixen_bot</Link> on Telegram</li>
            <li>2. Use natural language commands like "What's the weather in London?"</li>
            <li>3. Get instant results from our AI-powered workflows</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
));

FeatureItem.displayName = 'FeatureItem';
FeaturesSection.displayName = 'FeaturesSection';

export default FeaturesSection;