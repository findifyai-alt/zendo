import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';
import { localStore } from './localStore.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  workspaceName?: string
) {
  const fallbackUser = localStore.upsertUser({
    uid,
    email,
    displayName: displayName || 'Alex Morgan',
    workspaceName: workspaceName || 'Zendo Studio',
    name: displayName || 'Alex Morgan',
    organizationName: workspaceName || 'Zendo Studio',
    subscriptionTier: 'Pro',
  });

  try {
    if (process.env.SQL_HOST && global._postgresPool) {
      const result = await db
        .insert(users)
        .values({
          uid,
          email,
          name: displayName || 'Alex Morgan',
          organizationName: workspaceName || 'Zendo Studio',
          displayName: displayName || 'Alex Morgan',
          workspaceName: workspaceName || 'Zendo Studio',
          subscriptionTier: 'Pro',
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
            name: displayName || 'Alex Morgan',
            organizationName: workspaceName || 'Zendo Studio',
            displayName: displayName || 'Alex Morgan',
            workspaceName: workspaceName || 'Zendo Studio',
          },
        })
        .returning();

      if (result && result.length > 0) {
        return result[0];
      }
    }
  } catch (error) {
    // Silent fallback when postgres connection is unavailable
  }

  return fallbackUser;
}

export async function updateUserSetupInDb(
  uid: string,
  email: string,
  setup: {
    workspaceName: string;
    industry: string;
    servicesOffered: string;
    brandColor: string;
    typicalClientType: string;
    currency: string;
    proposalTone: string;
  }
) {
  const userRecord = await getOrCreateUser(
    uid,
    email,
    undefined,
    setup.workspaceName
  );

  const fallbackUpdated = localStore.upsertUser({
    uid,
    email,
    workspaceName: setup.workspaceName,
    organizationName: setup.workspaceName,
    industry: setup.industry,
    servicesOffered: setup.servicesOffered,
    brandColor: setup.brandColor,
    typicalClientType: setup.typicalClientType,
    currency: setup.currency,
    proposalTone: setup.proposalTone,
  });

  try {
    if (process.env.SQL_HOST && global._postgresPool) {
      const updated = await db
        .update(users)
        .set({
          workspaceName: setup.workspaceName,
          organizationName: setup.workspaceName,
          industry: setup.industry,
          servicesOffered: setup.servicesOffered,
          brandColor: setup.brandColor,
          typicalClientType: setup.typicalClientType,
          currency: setup.currency,
          proposalTone: setup.proposalTone,
        })
        .where(eq(users.id, userRecord.id))
        .returning();

      if (updated && updated.length > 0) {
        return updated[0];
      }
    }
  } catch (error) {
    // Silent fallback when postgres connection is unavailable
  }

  return fallbackUpdated;
}
