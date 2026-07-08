const fs = require('fs');
const path = require('path');

// Read the markdown file
const markdownContent = fs.readFileSync('C:\\Users\\ASUS TUF A15\\Desktop\\DevOPS\\Workspace\\spacejam\\design-best-practices.md', 'utf8');

// Create HTML with styling
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design Best Practices Guide</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            padding: 60px 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
        }

        h1 {
            color: #FF6A2F;
            font-size: 2.5rem;
            margin-bottom: 2rem;
            text-align: center;
            font-weight: 700;
            border-bottom: 3px solid #FF6A2F;
            padding-bottom: 1rem;
        }

        h2 {
            color: #2563EB;
            font-size: 1.8rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
            border-left: 4px solid #2563EB;
            padding-left: 1rem;
        }

        h3 {
            color: #1F2937;
            font-size: 1.3rem;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            font-weight: 600;
        }

        p {
            margin-bottom: 1rem;
            text-align: justify;
        }

        ul, ol {
            margin-bottom: 1rem;
            padding-left: 2rem;
        }

        li {
            margin-bottom: 0.5rem;
        }

        code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.9em;
        }

        pre {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            overflow-x: auto;
        }

        pre code {
            background: none;
            padding: 0;
            color: #1e293b;
        }

        .section {
            margin-bottom: 3rem;
        }

        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin: 1rem 0;
        }

        .example {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
        }

        .tip {
            background: #fef3c7;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
        }

        .footer {
            text-align: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9rem;
        }

        @media print {
            body {
                padding: 20px;
            }
            .container {
                padding: 40px 30px;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Design Best Practices Guide</h1>

        <div class="section">
            <h2>1. Visual Hierarchy</h2>
            <p><strong>Purpose:</strong> Guide users through content by establishing clear levels of importance.</p>

            <h3>Principles</h3>
            <ul>
                <li><strong>Size:</strong> Larger elements demand attention</li>
                <li><strong>Color:</strong> Use strategic color contrast to highlight key actions</li>
                <li><strong>Contrast:</strong> Ensure sufficient contrast for accessibility (4.5:1 for text)</li>
                <li><strong>Spacing:</strong> Use whitespace to create relationships between elements</li>
                <li><strong>Typography:</strong> Weight and style variations create hierarchy</li>
            </ul>

            <div class="example">
                <h3>Implementation</h3>
                <pre><code>/* Primary heading */
h1 { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }

/* Secondary heading */
h2 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.75rem; }

/* Body text */
p { font-size: 1rem; line-height: 1.6; }</code></pre>
            </div>
        </div>

        <div class="section">
            <h2>2. Color Theory</h2>
            <h3>Color Fundamentals</h3>
            <ul>
                <li><strong>Primary colors:</strong> Define your brand palette (2-3 main colors)</li>
                <li><strong>Secondary colors:</strong> Support and complement primary colors</li>
                <li><strong>Neutral palette:</strong> Grays, whites, and blacks for text and backgrounds</li>
                <li><strong>Accent colors:</strong> Used sparingly for calls-to-action</li>
            </ul>

            <h3>Best Practices</h3>
            <ul>
                <li>Maintain consistent color usage throughout the application</li>
                <li>Use semantic colors (success/error/warning)</li>
                <li>Ensure accessibility with proper contrast ratios</li>
                <li>Create a color system with tokens</li>
            </ul>

            <div class="example">
                <h3>Color System Example</h3>
                <pre><code>:root {
  --primary: #FF6A2F;
  --primary-dark: #E55A2B;
  --primary-light: #FF924F;
  --secondary: #2563EB;
  --success: #10B981;
  --error: #EF4444;
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-900: #111827;
}</code></pre>
            </div>
        </div>

        <div class="section">
            <h2>3. Typography</h2>
            <h3>Typography Scale</h3>
            <p>Create a harmonious type scale based on a ratio (typically 1.25):</p>
            <ul>
                <li><strong>Display:</strong> clamp(2.5rem, 5vw, 4rem)</li>
                <li><strong>Heading 1:</strong> clamp(1.875rem, 3vw, 2.5rem)</li>
                <li><strong>Heading 2:</strong> clamp(1.5rem, 2vw, 2rem)</li>
                <li><strong>Heading 3:</strong> 1.25rem</li>
                <li><strong>Body:</strong> 1rem</li>
                <li><strong>Small:</strong> 0.875rem</li>
            </ul>

            <h3>Spacing Scale</h3>
            <p>Use consistent spacing based on your base unit (8px):</p>
            <ul>
                <li>0.25x: 2px</li>
                <li>0.5x: 4px</li>
                <li>1x: 8px</li>
                <li>1.5x: 12px</li>
                <li>2x: 16px</li>
                <li>3x: 24px</li>
                <li>4x: 32px</li>
                <li>6x: 48px</li>
            </ul>
        </div>

        <div class="section">
            <h2>4. Layout Systems</h2>
            <h3>Grid Systems</h3>
            <ul>
                <li><strong>12-column grid:</strong> Most flexible for complex layouts</li>
                <li><strong>8-point grid:</strong> Ensures visual rhythm and alignment</li>
                <li><strong>Responsive breakpoints:</strong></li>
                <ul>
                    <li>Mobile: &lt; 768px</li>
                    <li>Tablet: 768px - 1024px</li>
                    <li>Desktop: &gt; 1024px</li>
                </ul>
            </ul>

            <h3>Layout Patterns</h3>
            <ul>
                <li><strong>Card-based:</strong> Content contained in bordered regions</li>
                <li><strong>Zig-zag:</strong> Alternating left/right layouts</li>
                <li><strong>Grid layouts:</strong> Consistent sizing and alignment</li>
                <li><strong>Full-bleed:</strong> Edge-to-edge content with proper padding</li>
            </ul>
        </div>

        <div class="section">
            <h2>5. Component Design</h2>
            <div class="two-column">
                <div>
                    <h3>Button Design</h3>
                    <ul>
                        <li><strong>Primary:</strong> Bold color, prominent placement</li>
                        <li><strong>Secondary:</strong> Outline or subdued background</li>
                        <li><strong>Tertiary:</strong> Text-only, minimal styling</li>
                        <li><strong>Group related buttons</strong> appropriately</li>
                        <li><strong>Always include loading states</strong></li>
                    </ul>
                </div>
                <div>
                    <h3>Form Design</h3>
                    <ul>
                        <li><strong>Labels above inputs</strong> for better accessibility</li>
                        <li><strong>Placeholder text</strong> should hint at format</li>
                        <li><strong>Error states</strong> with clear messaging</li>
                        <li><strong>Progress indicators</strong> for multi-step forms</li>
                        <li><strong>Autocomplete</strong> where appropriate</li>
                    </ul>
                </div>
            </div>

            <h3>Data Display</h3>
            <ul>
                <li><strong>Tables:</strong> Sortable columns, pagination, clear headers</li>
                <li><strong>Cards:</strong> Scannable information hierarchy</li>
                <li><strong>Lists:</strong> Consistent spacing and icons</li>
                <li><strong>Badges:</strong> Status indicators with clear meaning</li>
            </ul>
        </div>

        <div class="section">
            <h2>6. Accessibility</h2>
            <h3>WCAG Guidelines</h3>
            <ul>
                <li><strong>AA standard:</strong> Minimum accessibility requirement</li>
                <li><strong>AAA standard:</strong> Enhanced accessibility</li>
            </ul>

            <h3>Key Requirements</h3>
            <ul>
                <li>Color contrast: 4.5:1 for normal text, 3:1 for large text</li>
                <li>Keyboard navigable: All functions available via keyboard</li>
                <li>Semantic HTML: Proper heading structure, landmarks</li>
                <li>Focus indicators: Visible focus states</li>
                <li>Alt text: Descriptive text for images</li>
            </ul>

            <h3>Testing</h3>
            <ul>
                <li>Use screen readers (NVDA, VoiceOver)</li>
                <li>Test with keyboard only</li>
                <li>Check color contrast with tools</li>
                <li>Validate contrast ratios</li>
            </ul>
        </div>

        <div class="section">
            <h2>7. Micro-interactions</h2>
            <h3>Purpose</h3>
            <p>Provide feedback and enhance user experience.</p>

            <h3>Types</h3>
            <ul>
                <li><strong>Hover states:</strong> Visual feedback on interaction</li>
                <li><strong>Loading states:</strong> Indicate processing</li>
                <li><strong>Success/error:</strong> Confirmation of actions</li>
                <li><strong>Transitions:</strong> Smooth animations between states</li>
            </ul>

            <div class="tip">
                <h3>Best Practices</h3>
                <ul>
                    <li>Keep animations quick (150-300ms)</li>
                    <li>Use easing functions (ease-in-out)</li>
                    <li>Don't overanimate</li>
                    <li>Ensure accessibility preferences are respected</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>8. Consistency</h2>
            <h3>Design System</h3>
            <ul>
                <li>Create a centralized component library</li>
                <li>Document usage guidelines</li>
                <li>Version and update systematically</li>
                <li>Include all variants and states</li>
            </ul>

            <h3>Pattern Library</h3>
            <ul>
                <li><strong>Buttons:</strong> Sizes, states, purposes</li>
                <li><strong>Forms:</strong> Input types, validation patterns</li>
                <li><strong>Navigation:</strong> Menus, breadcrumbs, pagination</li>
                <li><strong>Data visualization:</strong> Charts, graphs, tables</li>
            </ul>
        </div>

        <div class="section">
            <h2>9. Performance Considerations</h2>
            <div class="two-column">
                <div>
                    <h3>Image Optimization</h3>
                    <ul>
                        <li>Use modern formats (WebP, AVIF)</li>
                        <li>Responsive images with srcset</li>
                        <li>Lazy loading for offscreen images</li>
                        <li>Compress images without quality loss</li>
                    </ul>
                </div>
                <div>
                    <h3>Code Optimization</h3>
                    <ul>
                        <li>Minimize CSS and JavaScript</li>
                        <li>Use CSS custom properties for theming</li>
                        <li>Optimize font loading</li>
                        <li>Implement proper caching</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>10. Design Process</h2>
            <h3>Research</h3>
            <ul>
                <li>User interviews and surveys</li>
                <li>Competitive analysis</li>
                <li>Analytics review</li>
                <li>Accessibility audit</li>
            </ul>

            <h3>Design</h3>
            <ul>
                <li>Wireframes and prototypes</li>
                <li>User testing</li>
                <li>Iterative improvements</li>
                <li>Stakeholder feedback</li>
            </ul>

            <h3>Implementation</h3>
            <ul>
                <li>Component development</li>
                <li>Style guide creation</li>
                <li>Documentation</li>
                <li>QA testing</li>
            </ul>
        </div>

        <div class="section">
            <h2>Conclusion</h2>
            <p>Good design is invisible - it just works. Follow these principles to create:</p>
            <ul>
                <li><strong>Accessible:</strong> Usable by everyone</li>
                <li><strong>Consistent:</strong> Predictable and familiar</li>
                <li><strong>Efficient:</strong> Helps users complete tasks</li>
                <li><strong>Delightful:</strong> Provides moments of joy</li>
            </ul>

            <div class="tip">
                <p><strong>Remember:</strong> Design is not about appearance, it's about how it works.</p>
            </div>
        </div>

        <div class="footer">
            <p>Created with best practices in mind</p>
            <p>Version 1.0 | Updated: 2026-07-08</p>
        </div>
    </div>
</body>
</html>
`;

// Write HTML file
fs.writeFileSync('C:\\Users\\ASUS TUF A15\\Desktop\\DevOPS\\Workspace\\spacejam\\design-best-practices.html', htmlContent);

console.log('HTML file created successfully. You can now convert it to PDF using your browser or a PDF converter.');