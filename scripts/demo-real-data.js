/**
 * Test script to demonstrate real vs mock data
 * This will create test records in Firestore and show the difference
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'seychelles-compliance-hub'
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    process.exit(1);
  }
}

async function createTestData() {
  const db = admin.firestore();

  // Create test client data
  const testClients = [
    {
      id: `client_${Date.now()}_test1`,
      companyName: 'Victoria Test Trading Ltd',
      incorporatorName: 'John Smith',
      incorporatorEmail: 'john.smith@example.com',
      businessActivity: 'International trading and investment services',
      authorizedCapital: '10000 USD',
      registrationStatus: 'initiated',
      createdAt: new Date().toISOString(),
      jurisdiction: 'SC',
      entityType: 'IBC',
      complianceStatus: 'pending_review',
      riskLevel: 'medium'
    },
    {
      id: `client_${Date.now()}_test2`,
      companyName: 'Seychelles Holdings IBC',
      incorporatorName: 'Sarah Johnson',
      incorporatorEmail: 'sarah.johnson@example.com',
      businessActivity: 'Investment holding and consulting',
      authorizedCapital: '5000 USD',
      registrationStatus: 'completed',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      jurisdiction: 'SC',
      entityType: 'IBC',
      complianceStatus: 'approved',
      riskLevel: 'low'
    }
  ];

  console.log('📝 Creating test client records...');
  
  for (const client of testClients) {
    await db.collection('clients').doc(client.id).set(client);
    console.log(`✅ Created client: ${client.companyName}`);
    
    // Create compliance tasks for each client
    const tasks = [
      {
        id: `task_${Date.now()}_${client.id}_1`,
        clientId: client.id,
        type: 'beneficial_ownership_collection',
        title: `BO Collection for ${client.companyName}`,
        description: 'Collect beneficial ownership information as required by BO Act 2020',
        status: client.registrationStatus === 'completed' ? 'completed' : 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: client.createdAt,
        assignedTo: 'compliance_team',
        regulatoryReference: 'BO Act 2020'
      },
      {
        id: `task_${Date.now()}_${client.id}_2`,
        clientId: client.id,
        type: 'document_verification',
        title: `Document Review for ${client.companyName}`,
        description: 'Review and verify submitted documentation',
        status: client.registrationStatus === 'completed' ? 'completed' : 'in_progress',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: client.createdAt,
        assignedTo: 'admin_team',
        regulatoryReference: 'IBC Act 2016'
      }
    ];
    
    for (const task of tasks) {
      await db.collection('tasks').doc(task.id).set(task);
      console.log(`  ✅ Created task: ${task.title}`);
    }
    
    // Create audit events
    const events = [
      {
        id: `event_${Date.now()}_${client.id}_onboard`,
        type: 'client.onboarding.initiated',
        clientId: client.id,
        timestamp: client.createdAt,
        data: {
          companyName: client.companyName,
          entityType: 'IBC',
          jurisdiction: 'SC'
        },
        source: 'test_script',
        userId: 'test_user'
      },
      {
        id: `event_${Date.now()}_${client.id}_tasks`,
        type: 'tasks.created',
        clientId: client.id,
        timestamp: client.createdAt,
        data: {
          taskCount: 2,
          complianceType: 'IBC_registration'
        },
        source: 'task_engine',
        userId: 'system'
      }
    ];
    
    for (const event of events) {
      await db.collection('events').doc(event.id).set(event);
      console.log(`  ✅ Created event: ${event.type}`);
    }
  }
  
  console.log('\n🎉 Test data created successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • Clients created: ${testClients.length}`);
  console.log(`   • Tasks created: ${testClients.length * 2}`);
  console.log(`   • Events created: ${testClients.length * 2}`);
  console.log('\n💰 Expected Revenue: $1,000 (2 clients × $500 each)');
  console.log('\n🔄 Now refresh your dashboard to see REAL data instead of mock data!');
}

async function showCurrentData() {
  const db = admin.firestore();
  
  console.log('\n📈 Current Database Status:');
  
  const clientsSnapshot = await db.collection('clients').get();
  const tasksSnapshot = await db.collection('tasks').get();
  const eventsSnapshot = await db.collection('events').get();
  
  console.log(`   📁 Clients: ${clientsSnapshot.size}`);
  console.log(`   📋 Tasks: ${tasksSnapshot.size}`);
  console.log(`   📝 Events: ${eventsSnapshot.size}`);
  
  if (clientsSnapshot.size > 0) {
    console.log('\n🏢 Client Details:');
    clientsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   • ${data.companyName} (${data.registrationStatus})`);
    });
  }
}

// Run the demonstration
async function runDemo() {
  console.log('🚀 Seychelles Compliance Hub - Real Data Demonstration\n');
  
  try {
    await showCurrentData();
    
    console.log('\n❓ Creating test data to demonstrate real vs mock...\n');
    await createTestData();
    
    console.log('\n📊 Updated Database Status:');
    await showCurrentData();
    
  } catch (error) {
    console.error('❌ Error during demo:', error.message);
  }
}

runDemo().then(() => {
  console.log('\n✅ Demo complete! Check your dashboard at http://localhost:3000');
  process.exit(0);
}).catch(error => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
});
