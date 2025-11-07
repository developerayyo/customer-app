import { Layout } from '../components/layout/Layout';

export default function ShareTarget() {
  let payload: any = null;
  try {
    const str = sessionStorage.getItem('shared-payload');
    payload = str ? JSON.parse(str) : null;
  } catch {}

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-2">Shared Content</h1>
        {payload ? (
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-600">Title:</span> {payload.title || '-'}</div>
            <div><span className="text-gray-600">Text:</span> {payload.text || '-'}</div>
            <div><span className="text-gray-600">Link:</span> {payload.link || '-'}</div>
            <div><span className="text-gray-600">Files:</span> {payload.files || 0}</div>
          </div>
        ) : (
          <p className="text-gray-500">No shared content detected.</p>
        )}
      </div>
    </Layout>
  );
}