import { build } from 'esbuild';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

async function buildWidget() {
  const entryFile = join(__dirname, '../webfeedback/widget-entry.tsx');
  const outputDir = join(__dirname, '../public/widget/v1');
  
  // Check if entry file exists
  if (!existsSync(entryFile)) {
    console.error(`❌ Entry file not found: ${entryFile}`);
    process.exit(1);
  }
  
  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true });
  
  try {
    await build({
      entryPoints: [entryFile],
      bundle: true,
      outfile: join(outputDir, 'webfeedback.js'),
      format: 'iife',
      globalName: 'WebFeedback',
      platform: 'browser',
      target: 'es2017',
      minify: false, // Set to false for debugging, can enable later
      sourcemap: false, // Disable sourcemap to avoid issues
      external: [], // Bundle everything including React
      packages: 'bundle', // Bundle all node_modules packages
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.css': 'text', // CSS as text, will be inlined
      },
      jsx: 'automatic', // Use automatic JSX runtime
      // Resolve all imports
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      // Ensure no external imports remain
      banner: {
        js: '/* WebFeedback Widget Bundle */',
      },
    });
    
    // Post-build validation
    const bundlePath = join(outputDir, 'webfeedback.js');
    const bundleContent = readFileSync(bundlePath, 'utf-8');
    
    // Verify bundle starts with expected pattern
    const expectedStart = 'var WebFeedback = (() => {';
    if (!bundleContent.includes(expectedStart)) {
      console.error('❌ Build validation failed: Bundle does not contain expected IIFE pattern');
      console.error('Bundle starts with:', bundleContent.substring(0, 200));
      process.exit(1);
    }
    
    // Verify no ES module import statements remain (check for actual import statements, not just the word "import")
    const importStatementRegex = /^\s*import\s+(?:\{[^}]*\}|\*|[\w$]+)\s+from\s+['"]/m;
    if (importStatementRegex.test(bundleContent)) {
      console.error('❌ Build validation failed: Bundle contains ES module import statements');
      const importLines = bundleContent.split('\n')
        .map((line, idx) => ({ line, idx: idx + 1 }))
        .filter(({ line }) => /^\s*import\s+(?:\{|[\w$]+|\*)\s+from/.test(line));
      console.error('Found import statements at lines:', importLines.map(({ idx }) => idx).join(', '));
      importLines.slice(0, 3).forEach(({ line, idx }) => {
        console.error(`  Line ${idx}: ${line.substring(0, 80)}`);
      });
      process.exit(1);
    }
    
    console.log('✅ Widget bundle built successfully!');
    console.log(`📦 Output: ${bundlePath}`);
    console.log(`📊 Bundle size: ${(bundleContent.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildWidget();

