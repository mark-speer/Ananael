/**
 * Migration Script: Add visibility field to shareable models
 * 
 * This script adds the visibility field (default: 'private') to all documents
 * in the 6 shareable model collections that don't already have it.
 * 
 * Usage:
 *   ts-node scripts/migrations/add-visibility.ts
 * 
 * The script is idempotent and safe to run multiple times.
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ananael';

const COLLECTIONS = [
  'talismandesigns',
  'solomioniccircles',
  'rituallayouts',
  'opusvessels',
  'practicevessels',
  'treenotes',
];

interface MigrationResult {
  collection: string;
  updated: number;
  skipped: number;
  errors: string[];
}

async function runMigration(): Promise<void> {
  let connection: typeof mongoose | null = null;

  try {
    console.log(`[Migration] Connecting to MongoDB: ${MONGODB_URI}`);
    connection = await mongoose.connect(MONGODB_URI);
    console.log('[Migration] Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection failed');
    }

    const results: MigrationResult[] = [];
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const collectionName of COLLECTIONS) {
      const result = await migrateCollection(db, collectionName);
      results.push(result);
      totalUpdated += result.updated;
      totalSkipped += result.skipped;
      totalErrors += result.errors.length;
    }

    // Log results
    console.log('\n[Migration] Results Summary:');
    console.log('================================');
    for (const result of results) {
      console.log(`\n${result.collection}:`);
      console.log(`  Updated: ${result.updated}`);
      console.log(`  Skipped: ${result.skipped}`);
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`);
        result.errors.forEach(err => console.log(`    - ${err}`));
      }
    }

    console.log('\n================================');
    console.log(`[Migration] Total Updated: ${totalUpdated}`);
    console.log(`[Migration] Total Skipped: ${totalSkipped}`);
    console.log(`[Migration] Total Errors: ${totalErrors}`);

    if (totalErrors > 0) {
      console.log('[Migration] ⚠️  Migration completed with errors');
      process.exit(1);
    } else {
      console.log('[Migration] ✓ Migration completed successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('[Migration] Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('[Migration] Disconnected from MongoDB');
    }
  }
}

async function migrateCollection(
  db: any,
  collectionName: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    collection: collectionName,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const collection = db.collection(collectionName);

    // Count documents without visibility field
    const docsWithoutVisibility = await collection.countDocuments({
      visibility: { $exists: false },
    });

    if (docsWithoutVisibility === 0) {
      result.skipped = await collection.countDocuments({});
      console.log(
        `[Migration] ${collectionName}: All ${result.skipped} documents already have visibility field`
      );
      return result;
    }

    // Update all documents without visibility field
    const updateResult = await collection.updateMany(
      { visibility: { $exists: false } },
      { $set: { visibility: 'private' } }
    );

    result.updated = updateResult.modifiedCount;
    result.skipped = await collection.countDocuments({ visibility: { $exists: true } }) - result.updated;

    console.log(
      `[Migration] ${collectionName}: Updated ${result.updated} documents, ${result.skipped} already had visibility`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Failed to migrate ${collectionName}: ${errorMsg}`);
    console.error(`[Migration] Error in ${collectionName}:`, error);
  }

  return result;
}

// Run the migration
runMigration();
