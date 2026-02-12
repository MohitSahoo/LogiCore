import fs from 'fs';
import path from 'path';
import { connectMongoDB, getDB, closeMongoDB } from '../src/mongodb.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateReportsToMongoDB() {
  try {
    console.log('🚀 Starting AI reports migration to MongoDB...\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ Connected to MongoDB\n');

    const db = getDB();
    const reportsCollection = db.collection('ai_reports');
    const chatQueriesCollection = db.collection('chat_queries');

    // Step 1: Remove chat_queries collection
    console.log('🗑️  Step 1: Removing chat_queries collection...');
    try {
      await chatQueriesCollection.drop();
      console.log('✅ chat_queries collection removed\n');
    } catch (error) {
      if (error.message.includes('ns not found')) {
        console.log('ℹ️  chat_queries collection does not exist, skipping...\n');
      } else {
        throw error;
      }
    }

    // Step 2: Read all JSON report files
    const reportsDir = path.join(__dirname, '..', 'reports');
    console.log(`📂 Step 2: Reading reports from ${reportsDir}...`);
    
    if (!fs.existsSync(reportsDir)) {
      console.log('❌ Reports directory not found!');
      return;
    }

    const files = fs.readdirSync(reportsDir).filter(file => file.endsWith('.json'));
    console.log(`📊 Found ${files.length} report files\n`);

    // Step 3: Migrate each report to MongoDB
    console.log('💾 Step 3: Migrating reports to MongoDB...');
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const filepath = path.join(reportsDir, file);
        const reportData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

        // Add file metadata
        const reportDocument = {
          ...reportData,
          migratedAt: new Date(),
          originalFilename: file,
          fileSize: fs.statSync(filepath).size
        };

        await reportsCollection.insertOne(reportDocument);
        console.log(`  ✅ Migrated: ${file}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to migrate ${file}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`  ✅ Successfully migrated: ${successCount} reports`);
    console.log(`  ❌ Failed: ${errorCount} reports`);
    console.log(`  📊 Total processed: ${files.length} files`);

    // Step 4: Create indexes for better query performance
    console.log('\n🔧 Step 4: Creating indexes...');
    await reportsCollection.createIndex({ 'metadata.type': 1 });
    await reportsCollection.createIndex({ 'metadata.generatedAt': -1 });
    await reportsCollection.createIndex({ 'metadata.userId': 1 });
    await reportsCollection.createIndex({ 'metadata.id': 1 }, { unique: true });
    console.log('✅ Indexes created');

    // Step 5: Verify migration
    console.log('\n🔍 Step 5: Verifying migration...');
    const totalReports = await reportsCollection.countDocuments();
    const weeklyReports = await reportsCollection.countDocuments({ 'metadata.type': 'weekly' });
    const monthlyReports = await reportsCollection.countDocuments({ 'metadata.type': 'monthly' });
    
    console.log(`  📊 Total reports in MongoDB: ${totalReports}`);
    console.log(`  📅 Weekly reports: ${weeklyReports}`);
    console.log(`  📅 Monthly reports: ${monthlyReports}`);

    // Sample report
    const sampleReport = await reportsCollection.findOne({}, { sort: { 'metadata.generatedAt': -1 } });
    if (sampleReport) {
      console.log(`\n📄 Latest report:`);
      console.log(`  ID: ${sampleReport.metadata.id}`);
      console.log(`  Type: ${sampleReport.metadata.type}`);
      console.log(`  Period: ${sampleReport.metadata.period}`);
      console.log(`  Generated: ${sampleReport.metadata.generatedAt}`);
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Update aiReportService.js to save reports to MongoDB instead of files');
    console.log('  2. Update API routes to fetch reports from MongoDB');
    console.log('  3. Optionally backup and remove the reports/ directory');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateReportsToMongoDB()
  .then(async () => {
    console.log('\n👋 Migration script finished');
    await closeMongoDB();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('\n💥 Migration script failed:', error);
    await closeMongoDB();
    process.exit(1);
  });
