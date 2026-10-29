import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { createProject, getProjects } from '../../db/repo';
import { EntityCollection } from '../../components/EntityCollection';
import { EntitySheet, type EntitySheetState } from '../../components/EntitySheet';
import { Header } from '../../components/Header';
import { MoreIcon } from '../../components/Icons';
import { Page } from '../../components/Page';
import { countBy, NotFound, plural, useRecord } from '../shared';

export function ProjectsScreen() {
  const { orgId = '' } = useParams();
  const navigate = useNavigate();
  const org = useRecord(() => db.organizations.get(orgId), [orgId]);
  const projects = useLiveQuery(() => getProjects(orgId), [orgId]);
  const counts = useLiveQuery(async () => {
    const ids = await db.projects.where('organizationId').equals(orgId).primaryKeys();
    return countBy(await db.lists.where('projectId').anyOf(ids).toArray(), (l) => l.projectId);
  }, [orgId]) ?? {};
  const [sheet, setSheet] = useState<EntitySheetState>({ open: false });

  if (org === null) return <NotFound />;

  return (
    <Page>
      {org && (
        <Header
          title={org.name}
          layoutKey={org.id}
          color={org.color}
          back="/"
          crumbs={[{ label: 'Organizations', to: '/' }]}
          actions={
            <button className="icon-btn" aria-label="Edit organization" onClick={() => setSheet({ open: true, entity: org })}>
              <MoreIcon />
            </button>
          }
        />
      )}
      {org && projects && (
        <EntityCollection
          kind="project"
          entities={projects}
          counts={counts}
          countLabel={plural('list')}
          hrefFor={(p) => `/o/${orgId}/p/${p.id}`}
          onCreate={(name, color) => createProject(orgId, name, color)}
          emptyTitle="No projects yet"
          emptyText={`Projects live inside ${org.name}. Each one holds its own lists.`}
        />
      )}
      <EntitySheet
        kind="organization"
        state={sheet}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        onDeleted={() => navigate('/', { replace: true })}
      />
    </Page>
  );
}
