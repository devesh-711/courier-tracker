import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from '@/components/ui';

export function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Name</label>
            <Input defaultValue="Admin User" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Email</label>
            <Input type="email" defaultValue="admin@courieros.com" />
          </div>
          <Button>Save changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-surface-400">Notification and display preferences will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
