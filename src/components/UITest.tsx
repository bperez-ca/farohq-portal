'use client';

// Test imports from @/lib/ui (inlined UI components)
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge, cn } from '@/lib/ui';

export function UITest() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">UI Package Test</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button>Default Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="secondary">Secondary Button</Button>
          </div>
          
          <Input placeholder="Test input" />
          
          <div className="flex gap-2">
            <Badge>Default Badge</Badge>
            <Badge variant="secondary">Secondary Badge</Badge>
            <Badge variant="destructive">Destructive Badge</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

