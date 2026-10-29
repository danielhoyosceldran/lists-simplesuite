import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { createList, getLists } from '../../db/repo';
import { EntityCollection } from '../../components/EntityCollection';
import { EntitySheet, type EntitySheetState } from '../../components/EntitySheet';
import { Header } from '../../components/Header';
import { MoreIcon } from '../../components/Icons';
import { Page } from '../../components/Page';
import { countBy, NotFound, useRecord } from '../shared';

export function ListsScreen() {
  const { orgId = '', projectId = '' } = useParams();
  const navigate = useNavigate();
  const org = useRecord(() => db.organizations.get(orgId), [orgId]);
  const project = useRecord(() => db.projects.get(projectId), [projectId]);
  const lists = useLiveQuery(() => getLists(projectId), [projectId]);
  const pending = useLiveQuery(async () => {
    const ids = await db.lists.where('projectId').equals(projectId).primaryKeys();
    return countBy(await db.items.where('listId').anyOf(ids).toArray(), (i) => i.listId, (i) => !i.checked);
  }, [projectId]) ?? {};
  const [sheet, setSheet] = useState<EntitySheetState>({ open: false });

  if (org === null || project === null || (project && project.organizationId !== orgId)) return <NotFound />;

  const orgPath = `/o/${orgId}`;
  return (
    <Page>
      {org && project && (
        <Header
          title={project.name}
          layoutKey={project.id}
          color={project.color}
          back={orgPath}
          crumbs={[{ label: 'Organizations', to: '/' }, { label: org.name, to: orgPath }]}
          actions={
            <button className="icon-btn" aria-label="Edit project" onClick={() => setSheet({ open: true, entity: project })}>
              <MoreIcon />
            </button>
          }
        />
      )}
      {project && lists && (
        <EntityCollection
          kind="list"
          entities={lists}
          counts={pending}
          countLabel={() => 'pending'}
          hrefFor={(l) => `${orgPath}/p/${projectId}/l/${l.id}`}
          onCreate={(name, color) => createList(projectId, name, color)}
          emptyTitle="No lists yet"
          emptyText="Create a list for groceries, chores, packing… then just start typing."
        />
      )}
      <EntitySheet
        kind="project"
        state={sheet}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        onDeleted={() => navigate(orgPath, { replace: true })}
      />
    </Page>
  );
}
