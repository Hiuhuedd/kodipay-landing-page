const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// We want to replace three specific strings:
// 1. Header: "Get Started"
// 2. Hero: "Get Started Now <ArrowRight"
// 3. Pricing Starter Plan: "Get Started Now" inside <Link href="/signup">

// Normalize the file content to standard Unix newlines for replacement matching
let normalized = content.replace(/\r\n/g, '\n');

// 1. Replace the header signup link label
const targetHeader = `                                Get Started
                            </Link>`;
const replacementHeader = `                                Get Started Free
                            </Link>`;

if (normalized.includes(targetHeader)) {
  console.log('✅ Found Header Get Started link. Replacing...');
  normalized = normalized.replace(targetHeader, replacementHeader);
} else {
  console.log('❌ Header target not found using default whitespace. Let us try direct string match.');
}

// 2. Replace the Hero CTA button label
const targetHero = `                            Get Started Now <ArrowRight size={14} />`;
const replacementHero = `                            Get Started Free <ArrowRight size={14} />`;

if (normalized.includes(targetHero)) {
  console.log('✅ Found Hero CTA button. Replacing...');
  normalized = normalized.replace(targetHero, replacementHero);
}

// 3. Replace the pricing Starter Plan button label
const targetPricing = `                                Get Started Now
                            </Link>`;
const replacementPricing = `                                Get Started Free
                            </Link>`;

if (normalized.includes(targetPricing)) {
  console.log('✅ Found Pricing Plan button. Replacing...');
  normalized = normalized.replace(targetPricing, replacementPricing);
}

// Write the normalized content back
fs.writeFileSync(filePath, normalized, 'utf8');
console.log('🎉 Update completed successfully!');
