import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { createOrganization, getOrganizations } from '../../db/repo';
import { EntityCollection } from '../../components/EntityCollection';
import { Header } from '../../components/Header';
import { SettingsIcon } from '../../components/Icons';
import { Page } from '../../components/Page';
import { countBy, plural } from '../shared';

export function OrganizationsScreen() {
  const orgs = useLiveQuery(getOrganizations);
  const counts = useLiveQuery(async () => countBy(await db.projects.toArray(), (p) => p.organizationId)) ?? {};

  return (
    <Page>
      <Header
        eyebrow="Simple Lists"
        title="Organizations"
        actions={
          <Link to="/settings" className="icon-btn" aria-label="Settings">
            <SettingsIcon />
          </Link>
        }
      />
      {orgs && (
        <EntityCollection
          kind="organization"
          entities={orgs}
          counts={counts}
          countLabel={plural('project')}
          hrefFor={(o) => `/o/${o.id}`}
          onCreate={createOrganization}
          emptyTitle="Start with an organization"
          emptyText="Organizations group your projects — Home, Work, a trip… anything."
        />
      )}
    </Page>
  );
}
