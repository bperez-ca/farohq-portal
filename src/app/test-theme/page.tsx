'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge,
  Alert,
  AlertDescription,
  AlertTitle,
  Separator,
  useTheme,
  BrandLogo
} from '@farohq/ui';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

export default function TestThemePage() {
  const { 
    theme, 
    toggleTheme, 
    brandTheme, 
    isBrandThemeLoading, 
    brandThemeError,
    refetchBrandTheme 
  } = useTheme();
  
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  // Read CSS variables
  useEffect(() => {
    const updateCSSVars = () => {
      if (typeof window === 'undefined') return;
      
      const root = getComputedStyle(document.documentElement);
      setCssVariables({
        '--brand-color': root.getPropertyValue('--brand-color').trim() || 'not set',
        '--brand-color-hover': root.getPropertyValue('--brand-color-hover').trim() || 'not set',
        '--brand-accent': root.getPropertyValue('--brand-accent').trim() || 'not set',
        '--brand-font': root.getPropertyValue('--brand-font').trim() || 'not set',
        '--primary': root.getPropertyValue('--primary').trim() || 'not set',
        '--primary-foreground': root.getPropertyValue('--primary-foreground').trim() || 'not set',
      });
    };

    updateCSSVars();
    const interval = setInterval(updateCSSVars, 500);
    return () => clearInterval(interval);
  }, [brandTheme, theme]);

  // Run tests
  useEffect(() => {
    const results: Record<string, boolean> = {
      'Theme loads from API': !isBrandThemeLoading && (brandTheme !== null || brandThemeError === null),
      'Brand color CSS variable set': cssVariables['--brand-color'] !== 'not set' && cssVariables['--brand-color'] !== '',
      'Primary color mapped to brand': cssVariables['--primary'] !== 'not set' && cssVariables['--primary'] !== '',
      'Logo URL available': brandTheme?.logoUrl !== undefined && brandTheme?.logoUrl !== null && brandTheme.logoUrl !== '',
      'Favicon URL available': brandTheme?.faviconUrl !== undefined && brandTheme?.faviconUrl !== null && brandTheme.faviconUrl !== '',
      'Theme persists (localStorage)': typeof window !== 'undefined' && localStorage.getItem('theme') !== null,
    };
    setTestResults(results);
  }, [brandTheme, isBrandThemeLoading, brandThemeError, cssVariables]);

  const allTestsPassed = Object.values(testResults).every(result => result === true);
  const passedCount = Object.values(testResults).filter(r => r).length;
  const totalCount = Object.keys(testResults).length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-foreground">White-Label Theme System Test</h1>
            <p className="text-muted-foreground">
              E2E testing for M0.2: White-Label Theme System
            </p>
          </div>
          <div className="flex items-center gap-4">
            <BrandLogo size="lg" showText={true} />
            <Button onClick={toggleTheme} variant="outline">
              {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
          </div>
        </div>

        <Separator />

        {/* Test Results Summary */}
        <Card className={allTestsPassed ? 'border-green-500' : 'border-yellow-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {allTestsPassed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
              )}
              Test Results: {passedCount}/{totalCount} Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(testResults).map(([test, passed]) => (
                <div key={test} className="flex items-center gap-2">
                  {passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                    {test}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme State */}
        <Card>
          <CardHeader>
            <CardTitle>Theme State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Loading State</p>
                <Badge variant={isBrandThemeLoading ? 'secondary' : 'default'}>
                  {isBrandThemeLoading ? 'Loading...' : 'Loaded'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Current Theme</p>
                <Badge>{theme}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Brand Theme</p>
                <Badge variant={brandTheme ? 'default' : 'secondary'}>
                  {brandTheme ? 'Available' : 'Not Available'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Error State</p>
                <Badge variant={brandThemeError ? 'destructive' : 'default'}>
                  {brandThemeError ? 'Error' : 'No Error'}
                </Badge>
              </div>
            </div>
            
            {brandThemeError && (
              <Alert variant="destructive">
                <AlertTitle>Error Loading Theme</AlertTitle>
                <AlertDescription>
                  {brandThemeError.message}
                  {brandThemeError.message.includes('ECONNREFUSED') || brandThemeError.message.includes('Failed to fetch') ? (
                    <div className="mt-2 text-sm">
                      <p className="font-medium">Backend service not available</p>
                      <p className="mt-1">Make sure the gateway is running:</p>
                      <code className="block mt-1 p-2 bg-muted rounded text-xs">
                        docker compose up -d
                        <br />
                        # Or start gateway manually: cd services/gateway && go run cmd/gateway/main.go
                      </code>
                    </div>
                  ) : null}
                </AlertDescription>
              </Alert>
            )}
            
            {!brandTheme && !isBrandThemeLoading && !brandThemeError && (
              <Alert>
                <AlertTitle>Using Default Theme</AlertTitle>
                <AlertDescription>
                  No brand theme loaded. Using default theme colors. This is normal if:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>No brand configuration exists for this domain/host</li>
                    <li>Backend service is not running</li>
                    <li>Theme API endpoint is not configured</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={() => refetchBrandTheme()} variant="outline" className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refetch Theme
              </Button>
              <Button 
                onClick={() => {
                  localStorage.removeItem('brand-theme');
                  refetchBrandTheme();
                }} 
                variant="outline"
                className="flex-1"
              >
                Clear Cache & Refetch
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Brand Theme Data */}
        {brandTheme && (
          <Card>
            <CardHeader>
              <CardTitle>Brand Theme Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div><strong>Agency ID:</strong> {brandTheme.agencyId || 'N/A'}</div>
                <div><strong>Logo URL:</strong> {brandTheme.logoUrl || 'N/A'}</div>
                <div><strong>Favicon URL:</strong> {brandTheme.faviconUrl || 'N/A'}</div>
                <div><strong>Primary Color:</strong> {brandTheme.primaryColor || 'N/A'}</div>
                <div><strong>Secondary Color:</strong> {brandTheme.secondaryColor || 'N/A'}</div>
                <div><strong>Font Family:</strong> {brandTheme.themeJson?.typography?.font_family || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CSS Variables */}
        <Card>
          <CardHeader>
            <CardTitle>CSS Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {Object.entries(cssVariables).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <span className="text-muted-foreground w-48">{key}:</span>
                  <span className="flex-1 text-foreground">{value || 'not set'}</span>
                  {value && value !== 'not set' && (
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ 
                        backgroundColor: key.includes('color') ? value : undefined,
                        background: key.includes('primary') ? `hsl(${value})` : undefined
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logo Display Test */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Display Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The logo below should display the brand logo from the theme, or fallback to default.
            </p>
            <div className="flex items-center gap-8 p-4 border rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Small</p>
                <BrandLogo size="sm" showText={true} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Medium</p>
                <BrandLogo size="md" showText={true} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Large</p>
                <BrandLogo size="lg" showText={true} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Extra Large</p>
                <BrandLogo size="xl" showText={true} />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Logo Only (no text)</p>
              <BrandLogo size="md" showText={false} />
            </div>
          </CardContent>
        </Card>

        {/* Button Color Test */}
        <Card>
          <CardHeader>
            <CardTitle>Button Color Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              All buttons below should use the brand color from the theme.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button>Default Button (Brand Color)</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="destructive">Destructive Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
              <Button size="sm">Small Button</Button>
              <Button size="lg">Large Button</Button>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">CTA Buttons (should use brand color):</p>
              <div className="flex gap-4">
                <Button className="bg-primary text-primary-foreground">Primary CTA</Button>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
                  Native Button with bg-primary
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Test */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation Persistence Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Navigate to other pages and verify theme persists. Theme should be maintained across navigation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/">
                <Button variant="outline">Home Page</Button>
              </Link>
              <Link href="/signin">
                <Button variant="outline">Sign In Page</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline">Sign Up Page</Button>
              </Link>
              <Link href="/test-ui">
                <Button variant="outline">UI Test Page</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
            <Alert className="mt-4">
              <AlertTitle>Test Instructions</AlertTitle>
              <AlertDescription>
                Click on any navigation link above, then use browser back button to return. 
                The theme should persist across all pages.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Favicon Test */}
        <Card>
          <CardHeader>
            <CardTitle>Favicon Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Check the browser tab icon. It should display the favicon from the brand theme.
            </p>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">Favicon URL:</p>
              <code className="text-xs bg-muted p-2 rounded block">
                {brandTheme?.faviconUrl || 'No favicon URL in theme'}
              </code>
            </div>
            <Alert className="mt-4">
              <AlertTitle>Manual Check Required</AlertTitle>
              <AlertDescription>
                Look at the browser tab icon. It should match the favicon URL above.
                If no favicon URL is set, the default favicon will be shown.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Acceptance Criteria Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>M0.2 Acceptance Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {testResults['Theme loads from API'] ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">✅ Theme loads from API on page load</p>
                  <p className="text-sm text-muted-foreground">
                    Brand theme should be fetched automatically when the page loads.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {testResults['Brand color CSS variable set'] && testResults['Primary color mapped to brand'] ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">✅ Brand color applies to all buttons/CTAs</p>
                  <p className="text-sm text-muted-foreground">
                    Buttons with bg-primary class should use the brand color from theme.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {testResults['Logo URL available'] ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">✅ Logo displays from brand config</p>
                  <p className="text-sm text-muted-foreground">
                    BrandLogo component should display the logo from brandTheme.logoUrl.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {testResults['Theme persists (localStorage)'] ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">✅ Theme persists across navigation</p>
                  <p className="text-sm text-muted-foreground">
                    Theme should be stored in localStorage and persist when navigating between pages.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {testResults['Favicon URL available'] ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">✅ Favicon updates from brand config</p>
                  <p className="text-sm text-muted-foreground">
                    Browser tab icon should update to match brandTheme.faviconUrl (manual check required).
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

