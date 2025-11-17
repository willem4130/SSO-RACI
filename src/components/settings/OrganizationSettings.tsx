'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Globe, Clock, Archive } from 'lucide-react';

interface OrganizationSettingsProps {
  organizationId: string;
}

export function OrganizationSettings({
  organizationId,
}: OrganizationSettingsProps) {
  const { data: organization, refetch } = api.organization.getById.useQuery({
    id: organizationId,
  });

  const [name, setName] = useState(organization?.name || '');
  const [locale, setLocale] = useState('en');
  const [timezone, setTimezone] = useState('UTC');

  const updateMutation = api.organization.update.useMutation({
    onSuccess: () => {
      toast.success('Organization settings updated successfully');
      refetch();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });

  const archiveMutation = api.organization.archive.useMutation({
    onSuccess: () => {
      toast.success('Organization archived successfully');
      window.location.href = '/dashboard';
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to archive organization');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: organizationId,
      name,
      settings: {
        locale,
        timezone,
      },
    });
  };

  const handleArchive = () => {
    if (
      confirm(
        'Are you sure you want to archive this organization? This action can be reversed.'
      )
    ) {
      archiveMutation.mutate({ id: organizationId });
    }
  };

  if (!organization) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Organization Settings</h2>
        <p className="text-muted-foreground">
          Manage your organization preferences and configuration
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            General
          </CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corporation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-slug">Organization Slug</Label>
            <Input
              id="org-slug"
              value={organization.slug}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              The slug cannot be changed after creation
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Localization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localization
          </CardTitle>
          <CardDescription>
            Language and regional preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="locale">Language</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger id="locale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="nl">Nederlands</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">
              <Clock className="inline h-4 w-4 mr-1" />
              Timezone
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Europe/Amsterdam">
                  Europe/Amsterdam (CET)
                </SelectItem>
                <SelectItem value="America/New_York">
                  America/New_York (EST)
                </SelectItem>
                <SelectItem value="America/Los_Angeles">
                  America/Los_Angeles (PST)
                </SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Statistics</CardTitle>
          <CardDescription>Overview of your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="text-2xl font-bold">
                {organization._count?.members || 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Projects</p>
              <p className="text-2xl font-bold">
                {organization._count?.projects || 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Matrices</p>
              <p className="text-2xl font-bold">
                {organization._count?.matrices || 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm font-medium">
                {new Date(organization.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Separator className="my-8" />

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Archive className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for this organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium">Archive Organization</p>
              <p className="text-sm text-muted-foreground">
                Archive this organization and all its data. Can be restored later.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? 'Archiving...' : 'Archive'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
