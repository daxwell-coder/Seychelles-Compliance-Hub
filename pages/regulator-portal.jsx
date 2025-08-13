import React, { useEffect, useState } from 'react';

// Simulated Firestore read-only fetch (replace with real Firestore in production)
async function fetchRegulatorData() {
  // Simulated data
  return {
    obligationsCount: 2,
    lastSnapshotHash: 'abc123',
    lastAuditChainRoot: 'def456',
    outstandingCriticalTasks: [
      { id: 'task-1', title: 'Update AML Policy', status: 'CRITICAL' },
      { id: 'task-2', title: 'Beneficial Ownership Review', status: 'CRITICAL' }
    ]
  };
}

export default function RegulatorPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegulatorData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">Regulator Portal (Read-Only MVP)</h1>
      <div className="mb-4">
        <strong>Current Obligations:</strong> {data.obligationsCount}
      </div>
      <div className="mb-4">
        <strong>Last Snapshot Hash:</strong> {data.lastSnapshotHash}
      </div>
      <div className="mb-4">
        <strong>Last Audit Chain Root:</strong> {data.lastAuditChainRoot}
      </div>
      <div>
        <strong>Outstanding CRITICAL Tasks:</strong>
        <ul className="list-disc ml-6 mt-2">
          {data.outstandingCriticalTasks.map((task) => (
            <li key={task.id} className="text-red-600">
              {task.title} (ID: {task.id})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
